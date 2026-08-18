/**
 * dsh-task-worktree browser half.
 *
 * Mounts:
 * - a worktree action panel into `conversation.input.dock` (the session input
 *   zone, same seat as the todo panel): buttons copy `/worktree ...` commands
 *   to the clipboard for the user to paste and send (方案 A; no host remote
 *   channel, no dependence on ui-conversation internals).
 *
 * Built by tsdown into the __ModuleLoader__ factory bundle at
 * client/client.js; the only externals are the loader module table's react
 * entries.
 */
import { createElement as h } from 'react'
import { en, zh } from './locales.ts'
import { WorktreePanel } from './WorktreePanel.tsx'

const NS = 'dsh-task-worktree'

/** The subset of the slots service this plugin touches (structural typing keeps
 * this external package free of monorepo-internal type dependencies). */
interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, component: () => unknown): unknown
}

/** The subset of the locale service this plugin touches. */
interface LocaleService {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(namespace: string): (key: string) => string
}

/** The client cordis context shape this plugin relies on. */
interface WorktreeClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: LocaleService
  slots: SlotsService
}

export const name = 'dsh-task-worktree'
export const inject = ['slots', 'locale']

export function apply(ctx: WorktreeClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${NS}: dictionaries`)

  // Locale-bound label lookup, stable across registrations. `bind` returns a
  // per-locale translator that re-reads the active locale on each call.
  const t = (key: string): string => ctx.locale.bind(NS)(key)

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'worktree',
    order: 10,
    locale: NS,
    inject: () => ({ t }),
  }, () => h(WorktreePanel, { t })))
}