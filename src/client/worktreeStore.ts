/**
 * Reactive per-session worktree mode store.
 *
 * Selecting Worktree mode in the mode dropdown arms the host immediately
 * (`/worktree mode-on`); the store mirrors that with the optional declared
 * name. Slot components read it through useSyncExternalStore.
 *
 * `explicit` records that the user answered for THIS conversation (worktree or
 * local). It is what keeps a configured default from overriding a deliberate
 * local choice: without it, "local" and "not decided yet" would look alike.
 */
/** State the components need for the current session. */
export interface WorktreeSessionState {
  /** Declared worktree name (arm-worktree-mode), or undefined. */
  name: string | undefined
  /** Worktree mode selected/armed (badge + strip on). */
  worktree: boolean
  /** The user chose a mode for this conversation (either one). */
  explicit: boolean
}

/** Plain observable store keyed by session id. */
export interface WorktreeStore {
  subscribe(listener: () => void): () => void
  getVersion(): number
  stateOf(sessionId: string | undefined): WorktreeSessionState
  /** Arm the host: worktree mode + optional name. */
  declare(sessionId: string | undefined, name: string | undefined): void
  /** Record a deliberate local choice for this conversation. */
  clear(sessionId: string | undefined): void
}

const UNDECIDED: WorktreeSessionState = { name: undefined, worktree: false, explicit: false }

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
      if (sessionId === undefined) return UNDECIDED
      return byId.get(sessionId) ?? UNDECIDED
    },
    declare(sessionId, name) {
      if (sessionId === undefined) return
      const current = byId.get(sessionId)
      const next = { name: name ?? undefined, worktree: true, explicit: true }
      if (current !== undefined && current.name === next.name && current.worktree && current.explicit) return
      const cloned = new Map(byId)
      cloned.set(sessionId, next)
      bump(cloned)
    },
    clear(sessionId) {
      if (sessionId === undefined) return
      const current = byId.get(sessionId)
      if (current !== undefined && !current.worktree && current.explicit) return
      const cloned = new Map(byId)
      cloned.set(sessionId, { name: undefined, worktree: false, explicit: true })
      bump(cloned)
    },
  }
}
