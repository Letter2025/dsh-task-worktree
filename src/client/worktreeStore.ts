/**
 * Reactive per-session worktree mode store.
 *
 * Selecting Worktree mode in the mode dropdown arms the host immediately
 * (`/worktree mode-on`); the store mirrors that with the optional declared
 * name. Slot components read it through useSyncExternalStore.
 */
/** State the components need for the current session. */
export interface WorktreeSessionState {
  /** Declared worktree name (arm-worktree-mode), or undefined. */
  name: string | undefined
  /** Worktree mode selected/armed (badge + strip on). */
  worktree: boolean
}

/** Plain observable store keyed by session id. */
export interface WorktreeStore {
  subscribe(listener: () => void): () => void
  getVersion(): number
  stateOf(sessionId: string | undefined): WorktreeSessionState
  /** Arm the host: worktree mode + optional name. */
  declare(sessionId: string | undefined, name: string | undefined): void
  clear(sessionId: string | undefined): void
}

export function createWorktreeStore(): WorktreeStore {
  let byId = new Map<string, WorktreeSessionState>()
  let version = 0
  const listeners = new Set<() => void>()

  const bump = (next: Map<string, WorktreeSessionState>): void => {
    byId = next
    version += 1
    for (const listener of listeners) listener()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion() {
      return version
    },
    stateOf(sessionId) {
      if (sessionId === undefined) return { name: undefined, worktree: false }
      return byId.get(sessionId) ?? { name: undefined, worktree: false }
    },
    declare(sessionId, name) {
      if (sessionId === undefined) return
      const current = byId.get(sessionId)
      const next = { name: name ?? undefined, worktree: true }
      if (current !== undefined && current.name === next.name && current.worktree === next.worktree) return
      const cloned = new Map(byId)
      cloned.set(sessionId, next)
      bump(cloned)
    },
    clear(sessionId) {
      if (sessionId === undefined) return
      if (!byId.has(sessionId)) return
      const cloned = new Map(byId)
      cloned.delete(sessionId)
      bump(cloned)
    },
  }
}