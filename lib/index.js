/**
 * dsh-task-worktree plugin entry: complete Git worktree support for
 * DeepSeek Harness, modeled on Qoder / Codex / Claude Code worktrees.
 *
 * Host side:
 * - per-repo manifest under `<repo>/.dsh-worktrees/manifest.json` (durable,
 *   atomic writes) — permanent worktrees survive sessions and restarts;
 * - `git worktree add -b <name>` checkouts (branch-based, so agents can
 *   commit normally inside the worktree), `ctx.subprocess` git runner;
 * - model tools: worktree_create / worktree_list / worktree_status;
 * - human command: /worktree create|list|status|finish|bring-back|remove|prune;
 * - worktree mode: `/worktree mode-on [name]` arms a session; the first
 *   genuine user message then carries an injected instruction (a plugin
 *   `instructions` context block) so the model creates the worktree inline;
 * - settings namespace `task-worktree`: the default mode for NEW conversations
 *   plus whether the composer selector remembers the last choice. A
 *   conversation that starts while the default is worktree mode arms itself on
 *   its first genuine user message — unless the user explicitly picked local
 *   mode for that conversation.
 *
 * @module dsh-task-worktree
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import z from '@deepseek-ai/schemastery'
import { registerWorktreeCommand } from './commands.js'
import { createSubprocessRunner } from './git.js'
import { createWorktreeManager } from './manager.js'
import { registerTools } from './tools.js'

export const name = 'task-worktree'
export const inject = ['tools', 'commands', 'subprocess']

const DEFAULT_DIR_NAME = '.dsh-worktrees'
const PLUGIN_ID = 'dsh-task-worktree'

/** Settings namespace owned by this plugin; the browser settings card keys to it. */
export const SETTINGS_NS = 'task-worktree'

/**
 * Runtime-editable settings of this plugin.
 *
 * - `defaultMode`: the mode a blank conversation starts in. `worktree` makes
 *   the host inject the creation instruction with the first genuine user
 *   message, so a new task is isolated without touching the dock selector.
 * - `rememberLastChoice`: the composer selector writes the mode the user picks
 *   back into `defaultMode`, so the next conversation starts the same way.
 *   Off by default, so an untouched installation keeps behaving exactly as it
 *   did before this setting existed: local mode, and a pick in the selector
 *   applies to its own conversation only.
 */
export const WorktreeSettings = z.object({
  defaultMode: z.union([z.const('local'), z.const('worktree')]).default('local'),
  rememberLastChoice: z.boolean().default(false),
})

/** Composed fallback, used until (and unless) a settings provider resolves. */
const SETTINGS_DEFAULTS = Object.freeze({ defaultMode: 'local', rememberLastChoice: false })

/** The instruction injected with the first user message of an armed session. */
function buildModeInstruction(name) {
  const named = name !== undefined && name !== ''
    ? `分支名为 "${name}" 的`
    : '一个（分支名请统一以 worktree/ 开头自行拟定，如 worktree/login，遵循 git ref 规则，支持 / 分层）'
  return `本次对话以任务 worktree 模式开始：请在本轮最先调用 worktree_create 创建${named}任务 worktree（分支名统一以 worktree/ 开头），创建后本次对话的工作请在返回的 worktree 路径（用绝对路径）内进行，不要在主工作区散落改动。任务完成后，请主动提醒用户收尾清理：告知实际创建的 worktree 名字与路径，并提供两条可复制命令二选一：/worktree bring-back <名字>（把改动并入主工作区，保留 checkout）；或 /worktree remove <名字> --force（直接强制删除该 worktree 与分支，含未提交改动）。`
}

/**
 * Mount the plugin.
 * @param ctx - cordis context.
 * @param config - optional `{ dirName? }` (profile patch layer).
 */
export function apply(ctx, config = {}) {
  const dirName = config?.dirName?.trim() || DEFAULT_DIR_NAME
  const runner = createSubprocessRunner(ctx)
  const manager = createWorktreeManager({ git: runner, dirName })
  registerTools(ctx, manager)

  // ── Settings: the new-conversation default mode, live-editable ──
  // Registered through a nested inject: on a host with no settings service the
  // callback never runs and the composed defaults above stand, exactly as the
  // profile configured them.
  let readSettings = () => SETTINGS_DEFAULTS
  ctx.inject(['settings'], (scoped) => {
    const scope = scoped.settings.register(SETTINGS_NS, WorktreeSettings, { base: { ...SETTINGS_DEFAULTS } })
    readSettings = () => scope.get()
    scoped.effect(() => () => {
      readSettings = () => SETTINGS_DEFAULTS
    })
  })

  // ── Worktree mode: armed sessions inject an instruction with their first user message ──
  /** Sessions armed by an explicit mode-on, with the optional branch name. */
  const armed = new Map()
  /** Sessions whose mode decision is already made (armed, or taken from the default). */
  const decided = new Set()
  /** Sessions the user explicitly put in local mode: the default must not re-arm them. */
  const suppressed = new Set()
  /** Sessions that started empty in this process (auto-default candidates). */
  const fresh = new Set()
  const actions = {
    arm(sessionId, name) {
      suppressed.delete(sessionId)
      armed.set(sessionId, { name: name?.trim() || undefined })
    },
    disarm(sessionId) {
      armed.delete(sessionId)
      suppressed.add(sessionId)
    },
  }
  const injectInstruction = (agent, name) => {
    agent.inject(createUserMessage({
      content: [{ type: 'text', text: buildModeInstruction(name) }],
      source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
    }))
  }
  ctx.on('agent/session-start', ({ agent, source }) => {
    // Only a conversation that starts empty can be auto-armed; a resumed one
    // already has a history and a mode of its own.
    if (source !== 'startup' && source !== 'clear') return
    if (!decided.has(agent.id)) fresh.add(agent.id)
  })
  ctx.on('agent/inbox/inserted', ({ agent, message }) => {
    // Only a genuine human prompt rides an injection; never re-arm on
    // producer-supplied context or tool results.
    if (message?.source?.kind !== 'user') return
    const pending = armed.get(agent.id)
    if (pending !== undefined) {
      armed.delete(agent.id)
      decided.add(agent.id)
      fresh.delete(agent.id)
      injectInstruction(agent, pending.name)
      return
    }
    if (decided.has(agent.id)) return
    // The first genuine prompt of a conversation with no history: the
    // configured default decides. `session.seq === 0` is the fallback for an
    // agent whose session-start beacon has not been observed yet.
    const untouched = fresh.has(agent.id) || agent.session?.seq === 0
    if (!untouched) return
    decided.add(agent.id)
    fresh.delete(agent.id)
    if (suppressed.has(agent.id)) return
    if (readSettings().defaultMode !== 'worktree') return
    injectInstruction(agent, undefined)
  })
  ctx.on('agent/disposed', ({ agent }) => {
    armed.delete(agent.id)
    decided.delete(agent.id)
    suppressed.delete(agent.id)
    fresh.delete(agent.id)
  })

  registerWorktreeCommand(ctx, manager, actions)
}