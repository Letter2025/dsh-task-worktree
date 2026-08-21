/**
 * Conversation-header worktree badge: renders a branch icon next to the
 * session title when this conversation is in worktree mode — declared via
 * start-in-worktree-mode (store) or running inside a checkout (cwd). Marks
 * the conversation in the Qoder style without consuming a workspace entry.
 */
import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { worktreeNameOfCwd } from './worktreeLedger.ts'
import type { WorktreeStore } from './worktreeStore.ts'
import css from './WorktreePanel.module.css'

/** Props: registrant inject only (components never see ctx). */
export interface WorktreeBadgeProps {
  /** Resolve the staged session id (the conversation whose header we sit in). */
  sessionIdOf(): string | undefined
  /** Current session cwd (immutable per session; one-shot read is enough). */
  currentCwd(): string | undefined
  /** The declared-worktree store. */
  store: WorktreeStore
  /** Locale string binder. */
  t(key: string): string
}

/** Minimal console/debug hook exposed for in-GUI diagnosis. */
declare global {
  interface Window {
    __dshTaskWorktreeDebug?: {
      sessionId: string | undefined
      declared: string | undefined
      declaredWorktree: boolean
      cwd: string | undefined
      label: string | undefined
    }
  }
}

/** Render the branch badge; nothing when the staged conversation has no worktree. */
export function WorktreeBadge(props: WorktreeBadgeProps): ReactNode {
  const { currentCwd, store, t } = props
  useSyncExternalStore(store.subscribe, store.getVersion)
  const sessionId = props.sessionIdOf()
  const cwdName = worktreeNameOfCwd(currentCwd())
  const declared = store.stateOf(sessionId)
  // Badge switches on once worktree mode is selected/armed (or the session
  // runs inside a checkout); a declared mode with no name shows the fallback.
  const fallback = declared.worktree ? t('badgeFallback') : undefined
  const name = declared.name ?? cwdName ?? fallback

  window.__dshTaskWorktreeDebug = {
    sessionId,
    declared: declared.name,
    declaredWorktree: declared.worktree,
    cwd: cwdName,
    label: name,
  }

  if (name === undefined) return null
  return (
    <div
      className={css.badge}
      role="status"
      title={`${t('badgeTooltip')}: ${name}`}
      data-testid="worktree-badge"
      data-worktree={name}
    >
      <IconBranchOutline16 size={13} className={css.badgeIcon} />
      <span>{name}</span>
    </div>
  )
}