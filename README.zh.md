# dsh-task-worktree

[![release](https://img.shields.io/npm/v/dsh-task-worktree?style=flat&label=release&color=blue)](https://www.npmjs.com/package/dsh-task-worktree)
[![downloads](https://img.shields.io/npm/dt/dsh-task-worktree?style=flat&label=downloads&color=blue)](https://www.npmjs.com/package/dsh-task-worktree)
[![stars](https://img.shields.io/github/stars/Letter2025/dsh-task-worktree?style=flat&label=stars&color=blue)](https://github.com/Letter2025/dsh-task-worktree)
[![license](https://img.shields.io/github/license/Letter2025/dsh-task-worktree?style=flat&label=license&color=blue)](LICENSE)
[![language](https://img.shields.io/github/languages/top/Letter2025/dsh-task-worktree?style=flat&label=language&color=blue)](https://github.com/Letter2025/dsh-task-worktree)
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供完整的 Git worktree 能力。**

[English](README.md) | 中文

一个社区插件：给 DSH 带来 Qoder / Codex / Claude Code 同款的**任务级 worktree 工作流**。每个任务拥有一个**独立的 `git worktree` checkout**（独立分支），记录在 per-repo manifest 中，**跨会话、跨重启永久保存**。主工作区保持干净；使用 worktree 的对话会在**会话头部显示分支徽标**（不再注册工作区、不打乱侧边栏），干完后**带回到主目录**（Move to local）或**直接提交**在 worktree 分支上——一切收尾都由你（人）显式决定。

设计参考：Qoder 的 `Worktree` 执行环境、Codex 的 `codex worktree create --permanent`、Claude Code 的 `--worktree` 会话，并适配 DSH 的会话/工作区模型。

## 设计对照

| 本插件概念 | Qoder | Codex | Claude Code |
| --- | --- | --- | --- |
| 任务级隔离 checkout | Worktree 执行环境 | `codex worktree create --permanent` | `claude --worktree <名称>` |
| worktree 位于 `<仓库>/.dsh-worktrees/` | 后台 worktree checkout | `.codex/worktrees/` | `.claude/worktrees/` |
| 注册表跨重启持久 | 按会话 | 全局索引 | 会话绑定 |
| 每任务独立分支 | 分支选择器 | — | `worktree-<名称>` |
| 从 GUI 打开（注册为 DSH 工作区） | 面板选择器 | `codex worktree open` | 直接进入 worktree |
| 会话头部徽标标识对话所用 worktree | 会话标识 | — | — |
| 把改动带回主目录 | Move to local | — | 退出/清理询问 |
| 直接在 worktree 分支提交 | Review & commit 面板 | worktree 会话内提交 | worktree 内提交 |
| 携带主目录未提交改动 | Include uncommitted changes | — | `.worktreeinclude` |
| 自动忽略 worktree 目录 | — | — | `.gitignore` 建议 |

## 工作流

```
空白对话：发送前在下拉框选「Worktree模式」（分支名可选，自动加 worktree/ 前缀）
   │  发送第一条消息 → 宿主注入一条「上下文注入」instructions 块
   ▼  模型在同一轮调用 worktree_create
   │  git worktree add -b worktree/<名称> <仓库>/.dsh-worktrees/worktree/worktree/<名称>
   │  不注册工作区、不切换对话；会话头部徽标标记该对话使用的 worktree
   ▼  对话原地继续，模型在 checkout 路径（绝对路径）内干活；完成后模型提醒收尾
   │
   ├─ /worktree bring-back worktree/<名称>   → 合并分支回主分支（要求主目录干净）
   ├─ /worktree finish worktree/<名称> <消息>  → 提交到 worktree 分支并保留
   └─ /worktree remove worktree/<名称> --force → 删除 worktree 与分支
                                                 （--force 连未提交改动一起删）
```

1. **以 Worktree 模式开始**：空白对话、发送前，dock 选择器显示「分支名：」——选「Worktree模式」即武装会话；分支名可选（输入的会自动加 `worktree/` 前缀，留空由模型拟定）。**对话开始后选择器自动隐藏**，由会话头部徽标接管指示。
2. **发送第一条消息** → 宿主在你消息前注入一条 `instructions` 上下文块（界面显示为「上下文注入」）：创建 `worktree/` 前缀分支、在 checkout 路径内干活、任务结束时**给出可复制的收尾命令**（`bring-back` 或 `remove --force`）。
3. 或跳过模式，直接让 agent 隔离任务：**"用 worktree 隔离干活，任务叫 xxx"** —— 模型调用 `worktree_create`，name 同时作分支名与路径（支持斜杠）。
4. **不注册任何工作区**，侧边栏保持干净；worktree 模式下会话头部显示分支徽标。
5. 干完后收尾：`bring-back` / `finish` / `remove`（均仅人工可触发）；`/worktree list` / `status` / `prune` 查看与清理（`prune` 顺带清理已消失 checkout 的工作区注册）。

## 安装

```bash
dsh plugin --profile web add dsh-task-worktree
```

要求：DeepSeek Harness `0.1.0-rc.7` 包线、Git 2.31+、Node 20+。

## 模型工具

| 工具 | 作用 |
| --- | --- |
| `worktree_create {name, baseCommit?, includeUncommitted?}` | 创建任务 worktree（name=分支名与相对路径，支持斜杠分层）；可选把主工作区未提交改动带进去 |
| `worktree_list` | 列出当前仓库所有受管理 worktree（状态 / dirty / 分支） |
| `worktree_status {name?}` | 查看单个 worktree 或当前会话所在 worktree 的状态 |

收尾与清理动作（finish / bring-back / remove）**只有人工可触发**，模型永远够不到。

## 人工命令

```
/worktree mode-on [<名称>]       武装 worktree 模式（下条消息随之注入指引）
/worktree mode-off               关闭 worktree 模式
/worktree create <名称> [<base>] [--carry]
/worktree list
/worktree status [<名称>]
/worktree finish <名称> <消息>
/worktree bring-back <名称> [<消息>]
/worktree remove <名称> [--force]
/worktree prune
```

## 安全模型

- `@deepseek-ai/*` **只作为 peerDependencies**——由宿主提供；插件绝不向 profile 安装基础设施副本（双实例会破坏 `TOOL_RUNTIME_SCHEDULER` 的 unique symbol，导致工具全部失效）。
- `bring-back` 要求主工作区干净（`MAIN_DIRTY`），且拒绝在 worktree 内执行。
- `remove` 拒绝删除当前会话所在的 worktree（`IN_USE`）。
- 所有 git 操作经 `ctx.subprocess`（harness-managed）；测试路径用 child_process runner。
- Manifest 原子写入（tmp + rename）；`prune` 清理 checkout 已不存在的记录。

## 本地开发

```bash
npm test              # 冒烟测试：临时仓库全生命周期
npm pack --dry-run    # 发布前检查包内容
```

## License

MIT — see [LICENSE](LICENSE)