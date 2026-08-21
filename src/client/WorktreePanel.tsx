/**
 * Compact local/worktree mode selector mounted above the composer.
 *
 * Selecting Worktree mode arms the host (the creation instruction rides the
 * next user message); the revealed strip optionally takes a name (Enter to
 * apply). Selecting Local mode disarms. Management commands (/worktree
 * list/status/...) stay available from the composer directly.
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { SessionFace } from '@deepseek-ai/dsh-client-runtime/client'
import {
  IconBranchOutline16,
  IconChevronDownOutline14,
  IconFolderOpenOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorktreeKey } from './locales.ts'
import type { WorktreeStore } from './worktreeStore.ts'
import css from './WorktreePanel.module.css'

const WORKTREE_PATH = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u

/** Minimal console/debug hook exposed for in-GUI diagnosis. */
declare global {
  interface Window {
    __dshTaskWorktreePanelDebug?: {
      sessionId: string | undefined
      mode: string
      hero: boolean
      declaredWorktree: boolean
    }
  }
}

/** Injected callbacks (from the plugin apply closure — components never see ctx). */
export interface WorktreePanelInjected {
  /** Resolve the current session face (or undefined when absent). */
  currentSession(): SessionFace | undefined
  /** Resolve the current session's workspace cwd from the session-list summary. */
  currentCwd(): string | undefined
  /** Whether the staged session is a blank (empty-log) conversation. */
  currentBlank(): boolean
  /** Open a fresh session in the local workspace that owns the current worktree (legacy checkout sessions). */
  openLocalWorkspace(): Promise<void>
  /** Arm worktree mode: the host injects the creation instruction with the next user message (optional name). */
  armWorktreeMode(name: string | undefined): Promise<void>
  /** Disarm worktree mode. */
  disarmWorktreeMode(): Promise<void>
}

export interface WorktreePanelProps extends WorktreePanelInjected {
  /** Locale-bound strings for the action labels. */
  t: (key: keyof WorktreeKey) => string
  /** The declared-worktree store. */
  store: WorktreeStore
  /** Resolve the staged session id. */
  sessionIdOf(): string | undefined
}

function currentMode(injected: WorktreePanelInjected): 'local' | 'worktree' {
  const cwd = injected.currentCwd()
  return typeof cwd === 'string' && WORKTREE_PATH.test(cwd) ? 'worktree' : 'local'
}

export function WorktreePanel(props: WorktreePanelProps): ReactNode {
  const { t, store, sessionIdOf } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const nameTimer = useRef<number | undefined>(undefined)
  /** Last raw name actually sent to the host (dedup guard for re-arms). */
  const lastAppliedRef = useRef<string>('')
  useSyncExternalStore(store.subscribe, store.getVersion)
  const sessionId = sessionIdOf()
  const declared = store.stateOf(sessionId)
  // Blank-hero bit still tracked for layout/debugging; the strip itself is
  // driven purely by the mode dropdown selection.
  const hero = props.currentBlank()
  // A conversation declared (or runs inside) a worktree shows worktree mode.
  const mode = declared.worktree || currentMode(props) === 'worktree' ? 'worktree' : 'local'

  // Keep the name input in sync with the committed worktree name.
  useEffect(() => {
    setName(declared.name ?? '')
  }, [declared.name])

  // Clear the pending name-apply timer on unmount.
  useEffect(() => () => {
    if (nameTimer.current !== undefined) window.clearTimeout(nameTimer.current)
  }, [])

  window.__dshTaskWorktreePanelDebug = {
    sessionId,
    mode,
    hero,
    declaredWorktree: declared.worktree,
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    const heroRow = root?.parentElement?.previousElementSibling
    if (root === null || root === undefined || !(heroRow instanceof HTMLElement) || root.closest('[data-phase="hero"]') === null) {
      root?.style.removeProperty('--worktree-hero-inset')
      return
    }

    const updateInset = (): void => {
      const rootRect = root.getBoundingClientRect()
      const rightEdge = Array.from(heroRow.querySelectorAll<HTMLElement>('*')).reduce((right, element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 ? Math.max(right, rect.right) : right
      }, rootRect.left)
      const inset = Math.max(0, Math.ceil(rightEdge - rootRect.left + 6))
      root.style.setProperty('--worktree-hero-inset', `${inset}px`)
    }

    updateInset()
    const resizeObserver = new ResizeObserver(updateInset)
    const mutationObserver = new MutationObserver(updateInset)
    resizeObserver.observe(heroRow)
    mutationObserver.observe(heroRow, { childList: true, subtree: true, characterData: true })
    window.addEventListener('resize', updateInset)
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', updateInset)
    }
  }, [])

  const closeMenu = (): void => {
    setOpen(false)
    setName('')
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node) !== true) closeMenu()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const showFailure = (): void => {
    setNotice(t('fail'))
    window.setTimeout(() => setNotice(null), 1800)
  }

  /** Legacy: leave a session actually running inside a worktree checkout. */
  const switchLocal = (): void => {
    if (busy !== null) return
    if (mode === 'local') {
      closeMenu()
      return
    }
    setBusy('local')
    void props.openLocalWorkspace().then(() => {
      closeMenu()
    }).catch(() => {
      showFailure()
    }).finally(() => {
      setBusy(null)
    })
  }

  const toggleMenu = (): void => {
    setOpen(value => !value)
  }

  /** 本地模式 radio: disarm the declared worktree mode, or leave a legacy checkout session. */
  const selectLocal = (): void => {
    if (busy !== null) return
    if (declared.worktree) {
      disarmMode()
      closeMenu()
      return
    }
    if (mode === 'worktree') {
      switchLocal()
      return
    }
    closeMenu()
  }

  /** Commit the typed worktree name: re-arms the host with that name (mode-on
 * is idempotent; the pending name simply updates). Debounced at 900ms and
 * deduplicated against the previously applied value — a single typing run
 * produces at most ONE command row in the conversation, not one per pause. */
  const applyName = (value: string): void => {
    setName(value)
    const trimmed = value.trim()
    if (trimmed === lastAppliedRef.current) return
    if (nameTimer.current !== undefined) window.clearTimeout(nameTimer.current)
    nameTimer.current = window.setTimeout(() => {
      nameTimer.current = undefined
      if (busy !== null) return
      lastAppliedRef.current = trimmed
      void props.armWorktreeMode(trimmed === '' ? undefined : trimmed).catch(() => {
        lastAppliedRef.current = ''
        showFailure()
      })
    }, 900)
  }

  const disarmMode = (): void => {
    if (busy !== null) return
    setBusy('disarmMode')
    void props.disarmWorktreeMode().catch(() => {
      showFailure()
    }).finally(() => {
      setBusy(null)
    })
  }

  // The mode selector only matters before the conversation starts; after the
  // first message the header badge carries the mode indication instead.
  if (!hero) return null

  return (
    <div
      ref={rootRef}
      className={css.root}
      data-testid="worktree-panel"
      data-mode={mode}
      aria-label={t('panelTitle')}
    >
      <button
        type="button"
        className={css.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        {mode === 'worktree'
          ? <IconBranchOutline16 size={14} className={css.icon} />
          : <IconFolderOpenOutline16 size={14} className={css.icon} />}
        <span>{mode === 'worktree' ? t('worktreeMode') : t('localMode')}</span>
        <IconChevronDownOutline14
          size={12}
          className={`${css.chevron} ${open ? css.chevronOpen : ''}`}
        />
      </button>

      {declared.worktree && (
        <div className={css.heroStart} data-testid="worktree-mode-start">
          <IconBranchOutline16 size={14} className={css.icon} />
          <span className={css.heroStartLabel}>{t('heroStartLabel')}</span>
          <input
            className={css.heroStartInput}
            value={name}
            onChange={event => applyName(event.target.value)}
            placeholder={t('heroStartPlaceholder')}
            aria-label={t('heroStartPlaceholder')}
            disabled={busy !== null}
          />
        </div>
      )}

      {open && (
        <div className={css.popover} role="menu" data-testid="worktree-mode-menu">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={mode === 'local'}
            className={`${css.menuItem} ${mode === 'local' ? css.selected : ''}`}
            disabled={busy !== null}
            onClick={selectLocal}
          >
            <IconFolderOpenOutline16 size={14} className={css.icon} />
            <span>{busy === 'local' ? t('switching') : t('localMode')}</span>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={mode === 'worktree'}
            className={`${css.menuItem} ${mode === 'worktree' ? css.selected : ''}`}
            disabled={busy !== null}
            onClick={() => {
              // Selecting worktree mode arms the host immediately (the
              // creation instruction rides the next message); the strip
              // lets you set a name with Enter.
              if (!declared.worktree) {
                void props.armWorktreeMode(undefined).catch(() => showFailure())
              }
              closeMenu()
            }}
          >
            <IconBranchOutline16 size={14} className={css.icon} />
            <span>{t('worktreeMode')}</span>
          </button>
        </div>
      )}

      {notice !== null && <span className={css.notice} role="status">{notice}</span>}
    </div>
  )
}