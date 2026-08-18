/**
 * `/worktree` human command surface. 収尾 actions (finish, bring-back,
 * remove, prune) are user-initiated only — the model never reaches them.
 *
 * @module dsh-task-worktree/commands
 */
import { registerWorkspaceHooks } from './workspace.js'

const USAGE = 'Usage: /worktree create <name> [<base>] [--carry] | list | status [<name>] | finish <name> <message> | bring-back <name> [<message>] | remove <name> [--force] | prune'

function formatEntry(entry) {
  const head = entry.head ? entry.head.slice(0, 7) : '—'
  const dirty = entry.dirty ? ' dirty' : ''
  return `${entry.name.padEnd(24)} ${entry.state.padEnd(12)} ${entry.branch} @ ${head}${dirty}  ${entry.path}`
}

function parse(rawInput) {
  const tokens = rawInput.trim().split(/\s+/u).filter(Boolean)
  if (tokens.length === 0) return { kind: 'list' }
  const [verb, ...rest] = tokens
  switch (verb) {
    case 'list':
    case 'ls':
      return { kind: 'list' }
    case 'status':
    case 'info':
      return { kind: 'status', name: rest[0] }
    case 'create': {
      const name = rest[0]
      if (!name) return { kind: 'usage' }
      const carry = rest.includes('--carry') || rest.includes('-c')
      const positional = rest.filter((t) => !t.startsWith('-'))
      const baseCommit = positional[1]
      return { kind: 'create', name, baseCommit, includeUncommitted: carry }
    }
    case 'finish': {
      const name = rest[0]
      const message = rest.slice(1).join(' ')
      if (!name || !message) return { kind: 'usage' }
      return { kind: 'finish', name, message }
    }
    case 'bring-back':
    case 'bringback':
    case 'move-to-local': {
      const name = rest[0]
      const message = rest.slice(1).join(' ')
      if (!name) return { kind: 'usage' }
      return { kind: 'bringBack', name, message: message || undefined }
    }
    case 'remove':
    case 'delete': {
      const name = rest[0]
      if (!name) return { kind: 'usage' }
      return { kind: 'remove', name, force: rest.includes('--force') }
    }
    case 'prune':
      return { kind: 'prune' }
    default:
      return { kind: 'unknown', verb }
  }
}

/**
 * Register the `/worktree` command.
 * @param ctx - cordis context (commands service injected).
 * @param manager - the worktree manager.
 */
export function registerWorktreeCommand(ctx, manager) {
  const hooks = registerWorkspaceHooks(ctx, manager)
  ctx.commands.register({
    name: 'worktree',
    description: 'manage task-scoped git worktrees: create/list/status/finish/bring-back/remove/prune',
    input: { hint: USAGE.replace(/^Usage: /, '') },
    handler: async (invocation) => {
      const parsed = parse(invocation.rawInput)
      const agent = invocation.agent
      const cwd = agent?.session?.header?.cwd ?? agent?.session?.cwd
      const currentDir = cwd
      const sessionId = agent?.session?.id ?? null
      try {
        switch (parsed.kind) {
          case 'usage':
          case 'unknown':
            return { kind: 'error', text: USAGE }
          case 'list': {
            const result = await manager.list(cwd)
            if (result.worktrees.length === 0) {
              return { kind: 'success', text: 'No managed task worktrees in this repository. Create one with /worktree create <name>.' }
            }
            return { kind: 'success', text: [`Task worktrees of ${result.repoRoot} (${result.dir}):`, ...result.worktrees.map(formatEntry)].join('\n') }
          }
          case 'status': {
            const result = await manager.status({ name: parsed.name, cwd })
            if (!result.worktree) {
              return { kind: 'success', text: 'This session is not inside a managed task worktree.' }
            }
            const w = result.worktree
            return {
              kind: 'success',
              text: [
                `worktree: ${w.name}`,
                `  path: ${w.path}`,
                `  branch: ${w.branch}`,
                `  state: ${w.state}${w.permanent ? ' (permanent)' : ''}`,
                `  base: ${w.baseCommit.slice(0, 7)}`,
                `  head: ${w.head ? w.head.slice(0, 7) : 'missing checkout'}`,
                `  dirty: ${w.dirty}`,
              ].join('\n'),
            }
          }
          case 'create': {
            const result = await manager.create({
              name: parsed.name,
              baseCommit: parsed.baseCommit,
              includeUncommitted: parsed.includeUncommitted,
              cwd,
              createdBy: sessionId,
            })
            await hooks.register(result.worktree)
            return {
              kind: 'success',
              text: [
                `Created task worktree "${result.worktree.name}".`,
                `  path: ${result.worktree.path}`,
                `  branch: ${result.worktree.branch}`,
                `  base: ${result.worktree.baseCommit.slice(0, 7)}`,
                'Open this path as a workspace to work inside the isolated checkout; or ask the model to continue there.',
              ].join('\n'),
            }
          }
          case 'finish': {
            const result = await manager.finish({ name: parsed.name, message: parsed.message, cwd, sourceSessionId: sessionId })
            return {
              kind: 'success',
              text: result.committed
                ? `Committed worktree "${result.name}" on ${result.branch} as ${(result.commitOid ?? '').slice(0, 7)}.`
                : `Worktree "${result.name}" was already clean on ${result.branch} at ${(result.commitOid ?? '').slice(0, 7)}.`,
            }
          }
          case 'bringBack': {
            const result = await manager.bringBack({ name: parsed.name, cwd, message: parsed.message })
            return {
              kind: 'success',
              text: `Brought back worktree "${result.name}" (${result.branch}) to main workspace; main HEAD is now ${result.mainHead.slice(0, 7)}. The worktree checkout is kept on disk.`,
            }
          }
          case 'remove': {
            const result = await manager.remove({ name: parsed.name, cwd, currentDir, force: parsed.force })
            await hooks.unregister(result.path)
            return { kind: 'success', text: `Removed worktree "${result.name}" (${result.branch}).` }
          }
          case 'prune': {
            const result = await manager.prune({ cwd })
            return {
              kind: 'success',
              text: result.pruned.length > 0
                ? `Pruned ${result.pruned.length} stale record(s): ${result.pruned.join(', ')}.`
                : 'No stale worktree records to prune.',
            }
          }
          default:
            return { kind: 'error', text: USAGE }
        }
      } catch (error) {
        return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
      }
    },
  })
}