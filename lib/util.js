/**
 * Shared helpers: session cwd resolution and canonical JSON rendering.
 * @module dsh-task-worktree/util
 */
/**
 * Resolve a session's immutable cwd defensively.
 * @param agent - tool/command execution agent.
 * @returns the session cwd, or undefined.
 */
export function sessionCwdOf(agent) {
  const session = agent?.session
  if (!session) return undefined
  const fromHeader = session.header?.cwd
  if (typeof fromHeader === 'string' && fromHeader.length > 0) return fromHeader
  const fromDirect = session.cwd
  if (typeof fromDirect === 'string' && fromDirect.length > 0) return fromDirect
  return undefined
}

/**
 * Canonical model-facing renderer: the value as one JSON text block.
 * @param value - the canonical tool output.
 * @returns a single text content block.
 */
export function renderJson(value) {
  return [{ type: 'text', text: JSON.stringify(value) }]
}