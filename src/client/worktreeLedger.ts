/**
 * Client-side worktree recognition helpers.
 *
 * The plugin no longer registers a workspace per worktree (that cluttered the
 * sidebar); each conversation is *labelled* instead. The label comes from the
 * worktree declaration store (armed via start-in-worktree-mode) or from the
 * session cwd when it runs inside a managed checkout.
 *
 * dsh 0.1.2 note: the transcript-scanning helper (`worktreeNameOfSnapshot`)
 * was removed — `@deepseek-ai/dsh-client-runtime` and its ConversationNode
 * model no longer exist; the badge derives the label from the store plus cwd.
 */

/** Registry path marker: <root>/.dsh-worktrees/worktree/<name...>. */
const WORKTREE_PATH = /[\\/]\.dsh-worktrees[\\/]worktree[\\/](.+)$/u

/**
 * Derive the worktree name from a session cwd running inside a managed
 * checkout, or undefined for a local session.
 */
export function worktreeNameOfCwd(cwd: string | undefined): string | undefined {
  if (typeof cwd !== 'string' || cwd === '') return undefined
  const match = WORKTREE_PATH.exec(cwd)
  return match === null ? undefined : match[1].replace(/[\\/]+$/u, '')
}