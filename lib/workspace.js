/**
 * Workspace registration hooks over DSH's `workspaceRegistry` service.
 * Best-effort by design: a registration failure never fails a git operation
 * — the worktree is durable on disk regardless; the workspace entry is a
 * convenience for opening it from the GUI later.
 *
 * @module dsh-task-worktree/workspace
 */

function isRegistryLike(value) {
  return Boolean(value)
    && typeof value === 'object'
    && typeof value.create === 'function'
    && typeof value.resolveByPath === 'function'
    && typeof value.delete === 'function'
}

/**
 * Build workspace hooks over the registry service, read dynamically through
 * `ctx.get` so an absent service degrades silently.
 * @param ctx - cordis context.
 * @param manager - the worktree manager (unused here; kept for symmetry).
 * @returns `{ register(entry), unregister(path) }`.
 */
export function registerWorkspaceHooks(ctx) {
  const registry = () => (ctx.get ? ctx.get('workspaceRegistry') : undefined)

  return {
    /** Register a worktree path as a DSH workspace named `[worktree] <name>`. */
    async register(entry) {
      const service = registry()
      if (!isRegistryLike(service)) return
      try {
        await service.create(entry.path, `[worktree] ${entry.name}`)
      } catch {
        // Best-effort: durability is on disk.
      }
    },
    /** Remove a workspace registration by its path, if any. */
    async unregister(path) {
      const service = registry()
      if (!isRegistryLike(service)) return
      try {
        const workspace = await service.resolveByPath(path)
        if (workspace !== undefined) await service.delete(workspace.id)
      } catch {
        // Stale registration is harmless.
      }
    },
  }
}