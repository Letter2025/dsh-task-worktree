/**
 * dsh-task-worktree browser half.
 *
 * Mounts a compact worktree action bar into `conversation.input.dock`.
 * Implements the Qoder-style environment flow through the client runtime
 * services:
 * - buttons execute `/worktree ...` on the current session (ISession.command);
 * - 「新建」creates the worktree then opens a fresh session inside its
 *   registered workspace (workspaces.create + startSession), so the user
 *   keeps typing in the isolated checkout.
 *
 * The plugin apply injects the sessions/workspaces services and hands plain
 * callbacks to the components (AGENTS.md client discipline).
 *
 * Built by tsdown into the __ModuleLoader__ factory bundle at
 * client/client.js; the only externals are the loader module table's react
 * entries.
 */
import { createElement as h } from 'react'
import type {
  ISession,
  ISessions,
  IWorkspaces,
} from '@deepseek-ai/dsh-client-runtime/client'
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
  sessions: ISessions
  workspaces: IWorkspaces
}

export const name = 'dsh-task-worktree'
export const inject = ['slots', 'locale', 'sessions', 'workspaces']

export function apply(ctx: WorktreeClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${NS}: dictionaries`)

  const t = (key: string): string => ctx.locale.bind(NS)(key)

  /** Resolve the current session face through the current selection id. */
  const currentSession = (): ISession | undefined => {
    const current = ctx.sessions.list.getSnapshot().current
    if (current === undefined) return undefined
    const binding = ctx.sessions.binding(current)
    return binding?.session
  }

  /** Resolve the current cwd from the list summary (the outward session face intentionally omits it). */
  const currentCwd = (): string | undefined => {
    const snapshot = ctx.sessions.list.getSnapshot()
    return snapshot.current !== undefined ? snapshot.byId[snapshot.current]?.cwd : undefined
  }

  /** Open the local workspace that owns the current worktree checkout. */
  const openLocalWorkspace = async (): Promise<void> => {
    const cwd = currentCwd()
    if (typeof cwd !== 'string' || cwd === '') {
      throw new Error('无法确定当前工作区路径')
    }
    const marker = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u.exec(cwd)
    const localPath = marker !== null ? cwd.slice(0, marker.index) : cwd
    const workspace = await ctx.workspaces.create({ path: localPath })
    ctx.workspaces.startSession(workspace.workspaceId)
  }

  /**
   * Open a fresh session inside the worktree's registered workspace.
   * The host-side create already registered the path under
   * `<session-cwd>/.dsh-worktrees/worktree/<name>`; workspaces.create is
   * idempotent and returns the existing workspace, whose id starts the
   * session.
   */
  const openWorktreeWorkspace = async (name: string): Promise<void> => {
    const cwd = currentCwd()
    if (typeof cwd !== 'string' || cwd === '') {
      throw new Error('无法确定主工作区路径')
    }
    const path = `${cwd.replace(/[\\/]+$/u, '')}\\.dsh-worktrees\\worktree\\${name}`
    const workspace = await ctx.workspaces.create({ path })
    ctx.workspaces.startSession(workspace.workspaceId)
  }

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'worktree',
    order: 10,
    locale: NS,
  }, () => h(WorktreePanel, {
    currentSession,
    currentCwd,
    openLocalWorkspace,
    openWorktreeWorkspace,
    t,
  })))
}
