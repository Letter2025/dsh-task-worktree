/**
 * Durable preferences of dsh-task-worktree, read and written through the
 * client settings scope (`ctx.settingsScope`, provided by
 * `@deepseek-ai/dsh-client-ui-settings`).
 *
 * The host half registers the `task-worktree` settings namespace; this store is
 * the browser mirror of it. It keeps a plain observable snapshot so slot
 * components can read it through `useSyncExternalStore`, and it routes every
 * user choice through the scope's revision-fenced writes.
 *
 * The settings transport is reached structurally rather than by importing its
 * types: this external package must stay free of monorepo-internal type
 * dependencies, and a host without the service simply never binds (the store
 * then reports `available: false` and the controls render disabled).
 */

/** Settings namespace owned by the host half; keep in sync with `lib/index.js`. */
export const SETTINGS_NS = 'task-worktree'

/** Mode a conversation can start in. */
export type DefaultMode = 'local' | 'worktree'

/**
 * The choice a user makes in the settings panel.
 *
 * Three states, because there are only three: pin local, pin worktree, or let
 * the composer decide and remember it. The first two map to
 * `{ defaultMode, rememberLastChoice: false }`, the third to
 * `rememberLastChoice: true` with `defaultMode` holding whatever was picked
 * last.
 */
export type NewConversationChoice = DefaultMode | 'last'

/** The user-editable section of the settings namespace. */
export interface WorktreePreferences {
  /** Mode a blank conversation starts in (the remembered pick under `last`). */
  defaultMode: DefaultMode
  /** Composer choices write `defaultMode` back, so the next conversation matches. */
  rememberLastChoice: boolean
}

/** Read the three-way panel choice out of a resolved section. */
export function choiceOf(prefs: Pick<WorktreePreferences, 'defaultMode' | 'rememberLastChoice'>): NewConversationChoice {
  return prefs.rememberLastChoice ? 'last' : prefs.defaultMode
}

/** Snapshot the components subscribe to. */
export interface WorktreePrefsSnapshot extends WorktreePreferences {
  /** Sync state of the settings transport (`loading` until the first answer). */
  status: 'loading' | 'ready' | 'unavailable'
  /** Whether a writable settings scope is bound (false: edits cannot persist). */
  available: boolean
}

/** One ordered write inside the settings namespace section. */
export interface SettingsFieldOp {
  op: 'set' | 'unset'
  path: string[]
  value?: unknown
}

/** The subset of the client settings scope this plugin touches. */
interface SettingsScopeLike<T> {
  getSnapshot(): {
    status: 'loading' | 'ready' | 'unavailable'
    value: T | undefined
    writable: boolean
  }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
  /** Atomic multi-field write; every host in the supported line exposes it. */
  mutate?(ops: readonly SettingsFieldOp[], expectedRevision?: number): Promise<void>
}

/** The subset of `ctx.settingsScope` this plugin touches. */
export interface SettingsScopeBinder {
  bind<T>(spec: { namespace: string; decode?: (section: unknown) => T | undefined }): SettingsScopeLike<T>
}

/** Observable preference store consumed by the panel and the settings card. */
export interface WorktreePrefsStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): WorktreePrefsSnapshot
  /** Bind the durable scope; returns the unsubscribe function (an effect body). */
  bind(binder: SettingsScopeBinder): () => void
  /** Write the mode a conversation just started with (composer "remember" path). */
  setDefaultMode(mode: DefaultMode): Promise<boolean>
  /** Write the panel's three-way choice, atomically. */
  setNewConversationChoice(choice: NewConversationChoice): Promise<boolean>
}

/** Snapshot used before any settings service answers (the schema defaults). */
export const PREFS_FALLBACK: WorktreePrefsSnapshot = Object.freeze({
  defaultMode: 'local' as DefaultMode,
  rememberLastChoice: false,
  status: 'loading' as const,
  available: false,
})

/**
 * Narrow one wire section to the section this plugin owns.
 *
 * The host resolves the schema before the value reaches the browser, so this
 * stays defensive rather than validating: an unexpected section keeps the last
 * accepted value (returning undefined). Both fields fall back to the schema
 * default (local, no remembering) rather than to a truthy guess.
 */
function decode(section: unknown): WorktreePreferences | undefined {
  if (typeof section !== 'object' || section === null || Array.isArray(section)) return undefined
  const raw = section as { defaultMode?: unknown; rememberLastChoice?: unknown }
  return {
    defaultMode: raw.defaultMode === 'worktree' ? 'worktree' : 'local',
    rememberLastChoice: raw.rememberLastChoice === true,
  }
}

export function createPrefsStore(): WorktreePrefsStore {
  let snapshot: WorktreePrefsSnapshot = PREFS_FALLBACK
  let scope: SettingsScopeLike<WorktreePreferences> | undefined
  const listeners = new Set<() => void>()

  const publish = (next: WorktreePrefsSnapshot): void => {
    if (
      snapshot.defaultMode === next.defaultMode
      && snapshot.rememberLastChoice === next.rememberLastChoice
      && snapshot.status === next.status
      && snapshot.available === next.available
    ) return
    snapshot = next
    for (const listener of listeners) listener()
  }

  /** Fold the scope's latest accepted section into the local snapshot. */
  const adopt = (): void => {
    if (scope === undefined) return
    const current = scope.getSnapshot()
    const value = current.value
    publish({
      defaultMode: value?.defaultMode === 'worktree' ? 'worktree' : 'local',
      rememberLastChoice: value?.rememberLastChoice !== false,
      status: current.status,
      available: current.status === 'ready' && current.writable,
    })
  }

  /**
   * Apply ordered writes and confirm acceptance by re-reading the scope.
   *
   * The transport RESOLVES even when the host refuses a write, so the resolved
   * promise proves nothing; the documented way to detect refusal is to read the
   * section back (a rejected write triggers the scope's recovery read first).
   * A host without `mutate` falls back to per-field `set`, which is the same
   * sequence without the atomicity fence.
   */
  const apply = async (ops: readonly SettingsFieldOp[]): Promise<boolean> => {
    if (scope === undefined) return false
    try {
      if (typeof scope.mutate === 'function') {
        await scope.mutate(ops)
      } else {
        for (const op of ops) {
          if (op.op === 'set') await scope.set(op.path[0], op.value)
        }
      }
    } catch (error) {
      console.warn(`[dsh-task-worktree] settings write failed: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
    const current = scope.getSnapshot()
    const section = current.value as Record<string, unknown> | undefined
    if (current.status !== 'ready' || section === undefined) return false
    const accepted = ops.every((op) => op.op !== 'set' || section[op.path[0]] === op.value)
    // Fold what the host accepted into our own snapshot now, rather than
    // waiting for the scope's change notification.
    adopt()
    return accepted
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      return snapshot
    },
    bind(binder) {
      scope = binder.bind<WorktreePreferences>({ namespace: SETTINGS_NS, decode })
      adopt()
      return scope.subscribe(adopt)
    },
    setDefaultMode(mode) {
      return apply([{ op: 'set', path: ['defaultMode'], value: mode }])
    },
    setNewConversationChoice(choice) {
      if (choice === 'last') {
        return apply([{ op: 'set', path: ['rememberLastChoice'], value: true }])
      }
      return apply([
        { op: 'set', path: ['defaultMode'], value: choice },
        { op: 'set', path: ['rememberLastChoice'], value: false },
      ])
    },
  }
}
