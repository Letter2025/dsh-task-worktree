/**
 * dsh-task-worktree plugin entry: complete Git worktree support for
 * DeepSeek Harness, modeled on Qoder / Codex / Claude Code worktrees.
 *
 * Host side:
 * - per-repo manifest under `<repo>/.dsh-worktrees/manifest.json` (durable,
 *   atomic writes) — permanent worktrees survive sessions and restarts;
 * - `git worktree add -b worktree-<name>` checkouts (branch-based, so agents
 *   can commit normally inside the worktree), `ctx.subprocess` git runner;
 * - model tools: worktree_create / worktree_list / worktree_status;
 * - human command: /worktree create|list|status|finish|bring-back|remove|prune;
 * - workspace registration (best-effort) so worktrees open from the GUI.
 *
 * Client side (UI) is delivered in a separate milestone; this entry stays
 * server-side only, deliberately avoiding the session-breaking surfaces of
 * the ecosystem's upstream plugin (no client-bundle injection here).
 *
 * @module dsh-task-worktree
 */
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { registerWorktreeCommand } from './commands.js'
import { createSubprocessRunner } from './git.js'
import { createWorktreeManager } from './manager.js'
import { registerTools } from './tools.js'

export const name = 'task-worktree'
export const inject = ['tools', 'commands', 'subprocess']

const DEFAULT_DIR_NAME = '.dsh-worktrees'

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
  registerWorktreeCommand(ctx, manager)
}