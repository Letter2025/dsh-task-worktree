/**
 * WorktreePanel: the `conversation.input.dock` entry — a compact action bar
 * above the composer implementing the Qoder-style worktree environment flow:
 *
 * - Buttons execute `/worktree ...` commands directly on the current session
 *   (`ISession.command`), not clipboard copies.
 * - 「新建」collects a name then runs `/worktree create <name>`; afterwards it
 *   resolves the created worktree's workspace and opens a fresh session there
 *   (`workspaces.startSession`) — the user lands in the isolated checkout and
 *   keeps typing; the composer content naturally goes to that session.
 *
 * The sessions/workspaces services are injected through the plugin's apply;
 * the components receive plain callbacks (AGENTS.md client discipline).
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ISession } from '@deepseek-ai/dsh-client-runtime/client'
import type { WorktreeKey } from './locales.ts'
import css from './WorktreePanel.module.css'

/** Injected callbacks (from the plugin apply closure — components never see ctx). */
export interface WorktreePanelInjected {
  /** Resolve the current session face (or undefined when absent). */
  currentSession(): ISession | undefined
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

export function WorktreePanel(props: WorktreePanelProps): ReactNode {
  const { t } = props
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const quickActions: { key: keyof WorktreeKey; line: string }[] = [
    { key: 'list', line: '/worktree list' },
    { key: 'status', line: '/worktree status' },
    { key: 'prune', line: '/worktree prune' },
  ]

  const runQuick = (line: string): void => {
    void runCommand(props, line).then(ok => {
      if (!ok) setNotice(t('fail'))
      setTimeout(() => setNotice(null), 1500)
    })
  }

  const submitCreate = (): void => {
    const trimmed = name.trim()
    if (trimmed === '' || busy !== null) return
    setBusy('create')
    void createAndOpen(props, trimmed).finally(() => {
      setBusy(null)
      setName('')
      setCreating(false)
    })
  }

  return (
    <div className={css.root} data-testid="worktree-panel" aria-label={t('panelTitle')}>
      <span className={css.title}>{t('panelTitle')}</span>
      <div className={css.actions}>
        {creating ? (
          <span className={css.createRow}>
            <input
              className={css.nameInput}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitCreate() }}
              placeholder={t('createPlaceholder')}
              autoFocus
            />
            <button type="button" className={css.action} disabled={busy !== null} onClick={submitCreate}>
              {busy === 'create' ? '…' : t('confirm')}
            </button>
            <button type="button" className={css.action} onClick={() => { setCreating(false); setName('') }}>
              {t('cancel')}
            </button>
          </span>
        ) : (
          <>
            <button type="button" className={css.action} onClick={() => setCreating(true)}>{t('create')}</button>
            {quickActions.map(a => (
              <button key={a.key} type="button" className={css.action} onClick={() => runQuick(a.line)}>
                {t(a.key)}
              </button>
            ))}
          </>
        )}
      </div>
      {notice !== null && <span className={css.notice}>{notice}</span>}
    </div>
  )
}