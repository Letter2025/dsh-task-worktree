/**
 * Model-facing task-worktree tools. Destructive and收尾 actions (remove,
 * finish, bring-back) are deliberately excluded: they are human commands only,
 * matching Qoder/Codex/Claude Code where acceptance and cleanup stay with the
 * user. The model may create, list, and inspect worktrees.
 *
 * @module dsh-task-worktree/tools
 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import { registerWorkspaceHooks } from './workspace.js'
import { renderJson, sessionCwdOf } from './util.js'

function resolveCwd(exec, ctx) {
  return sessionCwdOf(exec.agent) ?? ctx?.get?.('sessions')?.get?.(exec.agent?.session?.id)?.header?.cwd
}

/**
 * Register the safe model-facing worktree tools.
 * @param ctx - cordis context (tools service injected).
 * @param manager - the worktree manager.
 */
export function registerTools(ctx, manager) {
  const hooks = registerWorkspaceHooks(ctx, manager)
  ctx.tools.register(defineTool({
    name: 'worktree_create',
    description: '创建任务隔离的 worktree：在当前 Git 仓库新建独立 worktree。name 同时是分支名与相对路径（支持斜杠分层），位于 <仓库>/.dsh-worktrees/worktree/<name>；改动不影响主工作区，随后可打开该 worktree 目录作为新会话工作区。类似 Qoder 的 Worktree 执行环境与 Codex 的永久 worktree。',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: '分支名与 worktree 相对路径（支持斜杠分层，如 refactor/logging → 分支 refactor/logging，路径 .dsh-worktrees/worktree/refactor/logging）。遵循 git ref 规则：段由字母/数字/._- 组成，禁止开头/结尾斜杠、..、反斜杠。',
      },
      baseCommit: {
        type: 'string',
        description: '起始提交（commit-ish，缺省当前 HEAD）。',
      },
      includeUncommitted: {
        type: 'boolean',
        description: '是否把主工作区未提交的改动复制进新 worktree（缺省 false）。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', required: true },
          path: { type: 'string', required: true },
          branch: { type: 'string', required: true },
          repoRoot: { type: 'string', required: true },
          baseCommit: { type: 'string', required: true },
          createdAt: { type: 'string', required: true },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const cwd = resolveCwd(exec, ctx)
      if (!cwd) throw new Error('无法确定当前会话的工作目录')
      const result = await manager.create({
        name: args.name,
        baseCommit: args.baseCommit,
        includeUncommitted: args.includeUncommitted === true,
        cwd,
        createdBy: exec.agent?.session?.id ?? null,
        signal: exec.signal,
      })
      await hooks.register(result.worktree)
      return {
        name: result.worktree.name,
        path: result.worktree.path,
        branch: result.worktree.branch,
        repoRoot: result.repoRoot,
        baseCommit: result.worktree.baseCommit,
        createdAt: result.worktree.createdAt,
      }
    },
    presentCall: (args) => ({ card: 'generic', title: 'Create task worktree', kind: 'other', rawInput: args }),
  }))

  ctx.tools.register(defineTool({
    name: 'worktree_list',
    description: '列出当前仓库所有受管理的任务 worktree（名字、路径、分支、提交、dirty 状态）。',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repoRoot: { type: 'string', required: true },
          worktrees: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string', required: true },
                path: { type: 'string', required: true },
                branch: { type: 'string', required: true },
                state: { type: 'string', required: true },
                exists: { type: 'boolean', required: true },
                dirty: { type: 'boolean', required: true },
                head: { type: 'string' },
                permanent: { type: 'boolean', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    async execute(_args, exec) {
      const cwd = resolveCwd(exec, ctx)
      if (!cwd) throw new Error('无法确定当前会话的工作目录')
      const result = await manager.list(cwd, exec.signal)
      return {
        repoRoot: result.repoRoot,
        worktrees: result.worktrees.map((entry) => ({
          name: entry.name,
          path: entry.path,
          branch: entry.branch,
          state: entry.state,
          exists: entry.exists,
          dirty: entry.dirty ?? false,
          ...(entry.head ? { head: entry.head } : {}),
          permanent: entry.permanent,
        })),
      }
    },
    presentCall: () => ({ card: 'generic', title: 'List task worktrees', kind: 'other', rawInput: {} }),
  }))

  ctx.tools.register(defineTool({
    name: 'worktree_status',
    description: '查看一个任务 worktree 或当前会话所在 worktree 的状态（分支、HEAD、dirty、lifecycle state）。',
    parameters: {
      name: { type: 'string', description: 'worktree 名；缺省自动匹配当前会话所在的 worktree。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repoRoot: { type: 'string', required: true },
          inWorktree: { type: 'boolean', required: true },
          worktree: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string', required: true },
              path: { type: 'string', required: true },
              branch: { type: 'string', required: true },
              state: { type: 'string', required: true },
              exists: { type: 'boolean', required: true },
              dirty: { type: 'boolean', required: true },
              head: { type: 'string' },
              baseCommit: { type: 'string', required: true },
            },
          },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const cwd = resolveCwd(exec, ctx)
      if (!cwd) throw new Error('无法确定当前会话的工作目录')
      const result = await manager.status({ name: args.name, cwd, signal: exec.signal })
      if (!result.worktree) {
        return { repoRoot: result.repoRoot, inWorktree: false }
      }
      const w = result.worktree
      return {
        repoRoot: result.repoRoot,
        inWorktree: true,
        worktree: {
          name: w.name,
          path: w.path,
          branch: w.branch,
          state: w.state,
          exists: w.exists,
          dirty: w.dirty,
          ...(w.head ? { head: w.head } : {}),
          baseCommit: w.baseCommit,
        },
      }
    },
    presentCall: () => ({ card: 'generic', title: 'Task worktree status', kind: 'other', rawInput: {} }),
  }))
}