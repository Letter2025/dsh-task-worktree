/**
 * The plugin's card on the Plugins → Plugin configuration settings page.
 *
 * It owns the `task-worktree` settings namespace through ONE three-way choice:
 * pin local mode, pin worktree mode, or let the composer's picker decide and
 * remember it. Two controls (a mode plus a "remember" switch) would describe
 * the same three states with a fourth combination that means nothing, which is
 * why this is a single choice.
 *
 * Everything interactive is a host primitive: the trigger is the host `Button`
 * and the list is the host `Menu` — the same pair the Permission row uses for
 * its own "choose one" setting. What this module styles is only the card chrome
 * and the field typography, which the host does not export for plugin-owned
 * cards (`ui-settings-plugins` exports `apply`/`inject` and types only).
 *
 * Writes go through the client settings scope (revision-fenced, persisted by
 * the host), so the value is live and survives restarts. The card is dispatched
 * by the Plugins section under the settings namespace this plugin's host half
 * registers, so it appears only where that namespace is actually served.
 */
import { useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  IconChevronDownOutline14,
  Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorktreeKey } from './locales.ts'
import { choiceOf } from './worktreePrefs.ts'
import type { NewConversationChoice, WorktreePrefsStore } from './worktreePrefs.ts'
import css from './WorktreeSettings.module.css'

export interface WorktreeSettingsCardProps {
  /** Durable preferences (settings namespace `task-worktree`). */
  prefs: WorktreePrefsStore
  /** Locale-bound strings for the card copy. */
  t: (key: keyof WorktreeKey) => string
}

export function WorktreeSettingsCard({ prefs, t }: WorktreeSettingsCardProps): ReactNode {
  const snapshot = useSyncExternalStore(prefs.subscribe, prefs.getSnapshot)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const disabled = !snapshot.available || busy
  const choice = choiceOf(snapshot)
  // Under `last` the remembered pick is what actually happens, so the hint
  // says which mode that currently is.
  const remembered = snapshot.defaultMode === 'worktree' ? t('worktreeMode') : t('localMode')
  const hint = choice === 'last'
    ? `${t('settingsRememberHint')} ${t('settingsRememberedNow')}${remembered}`
    : choice === 'worktree'
      ? t('settingsDefaultWorktreeHint')
      : t('settingsDefaultLocalHint')

  const options: { id: NewConversationChoice; label: string }[] = [
    { id: 'local', label: t('localMode') },
    { id: 'worktree', label: t('worktreeMode') },
    { id: 'last', label: t('settingsRemember') },
  ]
  const selected = options.find(option => option.id === choice) ?? options[0]

  const choose = (next: string): void => {
    setMenuOpen(false)
    if (disabled || next === choice) return
    setBusy(true)
    setFailed(false)
    void prefs.setNewConversationChoice(next as NewConversationChoice).then(ok => {
      if (!ok) setFailed(true)
    }).finally(() => {
      setBusy(false)
    })
  }

  return (
    <div className={open ? `${css.card} ${css.cardOpen}` : css.card} data-testid="worktree-settings-card">
      <button
        type="button"
        className={css.header}
        aria-expanded={open}
        onClick={() => { setOpen(!open) }}
      >
        <div className={css.headText}>
          <div className={css.name}>{t('settingsCardTitle')}</div>
          <div className={css.description}>{t('settingsCardDesc')}</div>
        </div>
        <span className={open ? `${css.chevron} ${css.chevronOpen}` : css.chevron}>
          <IconChevronDownOutline14 size={14} />
        </span>
      </button>
      {open && (
        <div className={css.body}>
          <div className={css.field}>
            <div className={css.head}>
              <span className={css.label}>{t('settingsDefaultMode')}</span>
              <Menu
                open={menuOpen}
                onClose={() => { setMenuOpen(false) }}
                items={options}
                selectedId={choice}
                onSelect={choose}
                align="end"
                portal
                anchor={(
                  <Button
                    variant="toolbar"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    disabled={disabled}
                    onClick={() => { setMenuOpen(value => !value) }}
                  >
                    {selected.label}
                    <IconChevronDownOutline14 size={14} className={css.controlIcon} />
                  </Button>
                )}
              />
            </div>
            <p className={css.hint}>{hint}</p>
          </div>
          {snapshot.status === 'unavailable' && <p className={css.readOnly}>{t('settingsUnavailable')}</p>}
          {failed && <p className={css.failed} role="alert">{t('settingsSaveFailed')}</p>}
        </div>
      )}
    </div>
  )
}
