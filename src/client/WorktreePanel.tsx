/**
 * WorktreePanel: the `conversation.input.dock` entry — a one-row action bar
 * above the composer. Each button copies the matching `/worktree ...`
 * command to the clipboard; the user pastes it into the composer and sends
 * (方案 A without depending on ui-conversation's internal input machine —
 * external packages do not receive its SessionStandardProps inject).
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { WorktreeKey } from './locales.ts'
import css from './WorktreePanel.module.css'

interface ActionDef {
  key: keyof WorktreeKey
  command: string
  /** Placeholder suffix for name-requiring commands; kept empty for list/prune. */
  needsArg: boolean
}

const ACTIONS: readonly ActionDef[] = [
  { key: 'create', command: '/worktree create ', needsArg: true },
  { key: 'list', command: '/worktree list', needsArg: false },
  { key: 'status', command: '/worktree status ', needsArg: true },
  { key: 'bringBack', command: '/worktree bring-back ', needsArg: true },
  { key: 'remove', command: '/worktree remove ', needsArg: true },
  { key: 'prune', command: '/worktree prune', needsArg: false },
]

/** WorktreePanel receives no framework-injected props (external package). */
export interface WorktreePanelProps {
  /** Locale-bound strings for the action labels. */
  t: (key: keyof WorktreeKey) => string
}

/** Copy a command to the clipboard; falls back silently when unavailable. */
async function copyCommand(command: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(command)
    return true
  } catch {
    return false
  }
}

export function WorktreePanel({ t }: WorktreePanelProps): ReactNode {
  const [copied, setCopied] = useState<keyof WorktreeKey | null>(null)

  const handleAction = (action: ActionDef): void => {
    void copyCommand(action.command).then(ok => {
      if (ok) {
        setCopied(action.key)
        setTimeout(() => setCopied(null), 1200)
      }
    })
  }

  return (
    <div className={css.root} data-testid="worktree-panel" aria-label={t('panelTitle')}>
      <span className={css.title}>{t('panelTitle')}</span>
      <div className={css.actions}>
        {ACTIONS.map(action => (
          <button
            key={action.key}
            type="button"
            className={css.action}
            onClick={() => handleAction(action)}
            title={action.command.trim()}
          >
            {copied === action.key ? '✓' : t(action.key)}
          </button>
        ))}
      </div>
    </div>
  )
}