/**
 * Compact local/worktree mode selector mounted above the composer.
 *
 * The closed state mirrors the host's metadata controls. Existing worktree
 * commands remain available from the management view inside the popover.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ISession } from '@deepseek-ai/dsh-client-runtime/client'
import {
  IconBranchOutline16,
  IconChevronDownOutline14,
  IconChevronLeftOutline14,
  IconChevronRightOutline14,
  IconFolderOpenOutline16,
  IconGoalOutline16,
  IconListPenOutline16,
  IconPlusOutline16,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorktreeKey } from './locales.ts'
import css from './WorktreePanel.module.css'

type PanelView = 'mode' | 'actions' | 'create'

const WORKTREE_PATH = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u

/** Injected callbacks (from the plugin apply closure — components never see ctx). */
export interface WorktreePanelInjected {
  /** Resolve the current session face (or undefined when absent). */
  currentSession(): ISession | undefined
  /** Resolve the current session's workspace cwd from the session-list summary. */
  currentCwd(): string | undefined
  /** Open a fresh session in the local workspace that owns the current worktree. */
  openLocalWorkspace(): Promise<void>
  /** After `/worktree create <name>` succeeded, open a session in the new checkout. */
  openWorktreeWorkspace(name: string): Promise<void>
}

export interface WorktreePanelProps extends WorktreePanelInjected {
  /** Locale-bound strings for the action labels. */
  t: (key: keyof WorktreeKey) => string
}

/** Run one slash command on the current session; returns false on missing session or unhandled command. */
async function runCommand(injected: WorktreePanelInjected, line: string): Promise<boolean> {
  const session = injected.currentSession()
  if (session === undefined) return false
  const result = await session.command(line)
  if (!result.ok) return false
  return result.value.matched
}

/** Execute a command, then open the worktree workspace session for create actions. */
async function createAndOpen(injected: WorktreePanelInjected, name: string): Promise<void> {
  const matched = await runCommand(injected, `/worktree create ${name}`)
  if (!matched) throw new Error(`create command not matched: /worktree create ${name}`)
  await injected.openWorktreeWorkspace(name)
}

function currentMode(injected: WorktreePanelInjected): 'local' | 'worktree' {
  const cwd = injected.currentCwd()
  return typeof cwd === 'string' && WORKTREE_PATH.test(cwd) ? 'worktree' : 'local'
}

export function WorktreePanel(props: WorktreePanelProps): ReactNode {
  const { t } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<PanelView>('mode')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const mode = currentMode(props)

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
    setView('mode')
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

  const runQuick = (line: string): void => {
    if (busy !== null) return
    setBusy(line)
    void runCommand(props, line).then(ok => {
      if (!ok) showFailure()
      closeMenu()
    }).finally(() => {
      setBusy(null)
    })
  }

  const submitCreate = (): void => {
    const trimmed = name.trim()
    if (trimmed === '' || busy !== null) return
    setBusy('create')
    void createAndOpen(props, trimmed).then(() => {
      closeMenu()
    }).catch(() => {
      showFailure()
    }).finally(() => {
      setBusy(null)
      setName('')
    })
  }

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
    setView('mode')
    setName('')
  }

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

      {open && (
        <div className={css.popover} role="menu" data-testid="worktree-mode-menu">
          {view === 'mode' && (
            <>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={mode === 'local'}
                className={`${css.menuItem} ${mode === 'local' ? css.selected : ''}`}
                disabled={busy !== null}
                onClick={switchLocal}
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
                onClick={() => { if (mode === 'worktree') closeMenu(); else setView('create') }}
              >
                <IconBranchOutline16 size={14} className={css.icon} />
                <span>{t('worktreeMode')}</span>
              </button>
              <div className={css.separator} role="separator" />
              <button type="button" role="menuitem" className={css.menuItem} onClick={() => setView('actions')}>
                <IconListPenOutline16 size={14} className={css.icon} />
                <span>{t('manage')}</span>
                <IconChevronRightOutline14 size={12} className={css.trailingIcon} />
              </button>
            </>
          )}

          {view === 'actions' && (
            <>
              <div className={css.menuHeader}>
                <button type="button" className={css.backButton} aria-label={t('back')} onClick={() => setView('mode')}>
                  <IconChevronLeftOutline14 size={13} />
                </button>
                <span>{t('manage')}</span>
              </div>
              <button type="button" role="menuitem" className={css.menuItem} onClick={() => setView('create')}>
                <IconPlusOutline16 size={14} className={css.icon} />
                <span>{t('create')}</span>
              </button>
              <button type="button" role="menuitem" className={css.menuItem} onClick={() => runQuick('/worktree list')}>
                <IconListPenOutline16 size={14} className={css.icon} />
                <span>{t('list')}</span>
              </button>
              <button type="button" role="menuitem" className={css.menuItem} onClick={() => runQuick('/worktree status')}>
                <IconGoalOutline16 size={14} className={css.icon} />
                <span>{t('status')}</span>
              </button>
              <button type="button" role="menuitem" className={`${css.menuItem} ${css.danger}`} onClick={() => runQuick('/worktree prune')}>
                <IconTrashOutline16 size={14} className={css.icon} />
                <span>{t('prune')}</span>
              </button>
            </>
          )}

          {view === 'create' && (
            <div className={css.createPanel}>
              <div className={css.menuHeader}>
                <button type="button" className={css.backButton} aria-label={t('back')} onClick={() => setView('mode')}>
                  <IconChevronLeftOutline14 size={13} />
                </button>
                <span>{t('create')}</span>
              </div>
              <input
                className={css.nameInput}
                value={name}
                onChange={event => setName(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') submitCreate() }}
                placeholder={t('createPlaceholder')}
                autoFocus
              />
              <div className={css.createActions}>
                <button type="button" className={css.secondaryButton} onClick={() => setView('mode')}>
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className={css.primaryButton}
                  disabled={name.trim() === '' || busy !== null}
                  onClick={submitCreate}
                >
                  {busy === 'create' ? '…' : t('confirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {notice !== null && <span className={css.notice} role="status">{notice}</span>}
    </div>
  )
}
