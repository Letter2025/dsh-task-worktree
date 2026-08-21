/**
 * Client-side worktree recognition helpers.
 *
 * The plugin no longer registers a workspace per worktree (that cluttered the
 * sidebar); each conversation is *labelled* instead. The label comes from the
 * conversation's own transcript — a successful `worktree_create` tool result
 * or a successful `/worktree create` command — or from the session cwd when
 * it runs inside a managed checkout (legacy flow).
 */
import type { ConversationSnapshot, ConversationNode } from '@deepseek-ai/dsh-client-runtime/client'

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

/** Parse the `name` argument out of a worktree_create tool call. */
function nameOfToolCall(argsRaw: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
      const name = (parsed as { name?: unknown }).name
      return typeof name === 'string' && name.length > 0 ? name : undefined
    }
  } catch {
    // malformed args — not our create
  }
  return undefined
}

/**
 * Most recent successful worktree creation in one conversation snapshot, or
 * undefined when this conversation never created one.
 */
export function worktreeNameOfSnapshot(snapshot: ConversationSnapshot): string | undefined {
  const nodes = snapshot.nodes
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node: ConversationNode = nodes[index]
    if (node.kind === 'tool-result' && !node.isError && node.call?.name === 'worktree_create') {
      const name = nameOfToolCall(node.call.argsRaw)
      if (name !== undefined) return name
    }
    if (node.kind === 'command' && node.name === 'worktree' && node.outcome?.kind === 'success' && node.args !== null) {
      // args is the raw input after the command name, INCLUDING the separator
      // whitespace (" create test ..."), so tolerate leading spaces.
      const command = /^\s*create\s+(\S+)/u.exec(node.args)
      if (command !== null) return command[1]
    }
  }
  return undefined
}