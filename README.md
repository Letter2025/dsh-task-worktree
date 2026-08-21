# dsh-task-worktree

English | [中文](README.zh.md)

**Complete Git worktree support for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).**

A community plugin that gives DSH the **task-scoped worktree workflow** of Qoder / Codex / Claude Code: each task gets its own isolated `git worktree` checkout on its own branch, recorded in a per-repo manifest so it **survives sessions and restarts**. The main workspace stays untouched; conversations that use a worktree are marked with a **branch badge** on the session header (no workspace entry is created), and the changes can be **brought back** (Move to local) or **committed directly** on the worktree branch — always under explicit human control.

It follows the design of Qoder's `Worktree` execution environment, Codex's `codex worktree create --permanent`, and Claude Code's `--worktree` sessions, adapted to DSH's session/workspace model.

## Design

| Concept (this plugin) | Qoder | Codex | Claude Code |
| --- | --- | --- | --- |
| Task-scoped isolated checkout | Worktree execution environment | `codex worktree create --permanent` | `claude --worktree <name>` |
| Worktrees live in `<repo>/.dsh-worktrees/` | background worktree checkout | `.codex/worktrees/` | `.claude/worktrees/` |
| Durable registry survives restarts | per-session | global index | session binding |
| Own branch per task | branch selector | — | `worktree-<name>` |
| Open as a DSH workspace from the GUI | panel selector | `codex worktree open` | launches into the worktree |
| Mark the conversation using the worktree | session badge | — | — |
| Bring changes back to main | Move to local | — | exit/cleanup prompt |
| Direct commit on the worktree branch | Review & commit panel | commit in the worktree session | commit in the worktree |
| Carry uncommitted main changes in | Include uncommitted changes toggle | — | `.worktreeinclude` |
| Auto-ignore the worktree directory | — | — | `.gitignore` tip |

## How it works

```
Blank conversation: pick "Worktree mode" in the dock dropdown (before the
conversation starts) → optional branch name (auto-prefixed "worktree/")
   │  send the first message → the host injects an instructions context block
   ▼  the model calls worktree_create on that same turn
   │  git worktree add -b worktree/<name> <repo>/.dsh-worktrees/worktree/worktree/<name>
   │  NO workspace is registered, NO conversation switch — the session header
   │  badge marks the worktree this conversation uses
   ▼  work continues in the same conversation (the model uses absolute paths
      inside the checkout); when done the model reminds you how to clean up
   │
   ├─ /worktree bring-back worktree/<name>   → merge the branch into the main branch
   │                                            (requires a clean main workspace)
   ├─ /worktree finish worktree/<name> <msg>  → commit on the worktree branch, keep it
   └─ /worktree remove worktree/<name> --force→ delete the worktree + branch
                                                (--force also deletes uncommitted changes)
```

1. **Start in worktree mode**: on a blank conversation the dock selector shows
   「Branch:」 before you send anything — picking "Worktree mode" ARMS the
   session, and the branch-name field is optional (typed names are
   auto-prefixed `worktree/`, blank lets the model propose one). The mode
   selector disappears once the conversation starts; the session-header badge
   takes over the indication.
2. **Send your first message** — the host injects one `instructions` context
   block (shown as 上下文注入) right before your message: create the worktree
   with a `worktree/`-prefixed branch, work inside the checkout path, and at
   the end remind the user with copy-paste cleanup commands
   (`bring-back` or `remove --force`).
3. Or skip the mode and ask the agent directly: **"用 worktree 隔离干活，任务叫 xxx"**
   — the model calls `worktree_create`; the name is both the branch and the
   relative path (slashes allowed).
4. No workspace entry is created, so the sidebar stays uncluttered. The badge
   on the session header shows the branch name while the conversation is in
   worktree mode.
5. When done: `bring-back` / `finish` / `remove` (all human-only, as above);
   `/worktree list` / `status` / `prune` inspect and clean up (`prune` also
   drops stale workspace registrations for removed checkouts).

## Install

```bash
dsh plugin --profile web add dsh-task-worktree
```

Requires: DeepSeek Harness `0.1.0-rc.7` package line, Git 2.31+, Node 20+.

## Model tools

| Tool | Purpose |
| --- | --- |
| `worktree_create {name, baseCommit?, includeUncommitted?}` | Create a task worktree (name = branch and relative path, slashes allowed); optionally carry uncommitted main-workspace changes in |
| `worktree_list` | List the repository's managed worktrees (state / dirty / branch) |
| `worktree_status {name?}` | Status of one worktree, or the one the current session is inside |

Delivery and cleanup actions (finish / bring-back / remove) stay **human-only** — the model never reaches them.

## Human commands

```
/worktree mode-on [<name>]     arm worktree mode (injection with the next message)
/worktree mode-off             disarm worktree mode
/worktree create <name> [<base>] [--carry]
/worktree list
/worktree status [<name>]
/worktree finish <name> <message>
/worktree bring-back <name> [<message>]
/worktree remove <name> [--force]
/worktree prune
```

## Safety model

- `@deepseek-ai/*` are **peerDependencies only** — the host supplies them; the plugin never installs infrastructure copies into a profile (a second instance breaks `TOOL_RUNTIME_SCHEDULER`'s unique symbol and kills tool calls).
- `bring-back` requires a clean main workspace (`MAIN_DIRTY`) and refuses to run from inside the worktree.
- `remove` refuses the worktree the current session is working inside (`IN_USE`).
- All git operations go through `ctx.subprocess` (harness-managed); the test path uses a child_process runner.
- Manifest writes are atomic (tmp + rename); `prune` drops records whose checkout no longer exists.

## Local development

```bash
npm test              # smoke test: full lifecycle on a scratch repository
npm pack --dry-run    # inspect the tarball before publishing
```

## License

MIT — see [LICENSE](LICENSE)