/**
 * dsh-task-worktree browser half.
 *
 * Mounts:
 * - a worktree panel into `conversation.input.dock` (the session input zone,
 *   same seat as the todo panel): lists the repository's managed worktrees
 *   and offers create / bring-back / remove actions.
 * - (planned) a worktree status card into `conversation.chat.node` after a
 *   worktree tool call.
 *
 * Actions are wired via方案 A: buttons fill the `/worktree ...` command text
 * into the composer; the host executes it and the panel refreshes from the
 * conversation events. No host-side remote channel is introduced (deferred
 * to方案 B).
 *
 * Built by tsdown into the __ModuleLoader__ factory bundle at
 * client/client.js; the only externals are the loader module table's react
 * entries.
 */
import { createElement as h } from 'react'
import { en, zh } from './locales.ts'

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
}

/** The client cordis context shape this plugin relies on. */
interface WorktreeClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: LocaleService
  slots: SlotsService
}

export const name = 'dsh-task-worktree'
export const inject = ['slots', 'locale']

/**
 * Placeholder panel: verifies the client bundle mounts without breaking the
 * host tool channel. UI-1/UI-2 components replace this renderer.
 * @returns a minimal dock node.
 */
function PlaceholderPanel(): unknown {
  return h('div', { 'data-worktree-panel': true }, 'dsh-task-worktree')
}

export function apply(ctx: WorktreeClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${NS}: dictionaries`)

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'worktree',
    order: 10,
    locale: NS,
    inject: () => ({}),
  }, PlaceholderPanel))
}