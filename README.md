# dsh-task-worktree

[![release](https://img.shields.io/npm/v/dsh-task-worktree?style=flat&label=release&color=blue)](https://www.npmjs.com/package/dsh-task-worktree)
[![downloads](https://img.shields.io/npm/dt/dsh-task-worktree?style=flat&label=downloads&color=blue)](https://www.npmjs.com/package/dsh-task-worktree)
[![stars](https://img.shields.io/github/stars/Letter2025/dsh-task-worktree?style=flat&label=stars&color=blue)](https://github.com/Letter2025/dsh-task-worktree)
[![license](https://img.shields.io/github/license/Letter2025/dsh-task-worktree?style=flat&label=license&color=blue)](LICENSE)
[![docs](https://img.shields.io/badge/docs-English%20%7C%20%E4%B8%AD%E6%96%87-0075cc?style=flat&labelColor=555555)](https://github.com/Letter2025/dsh-task-worktree/blob/main/README.zh.md)
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

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
Blank conversation: the mode selector above the composer follows the configured
default (Settings → Plugins → Task worktree), or pick "Worktree mode" yourself
   │  optional branch name (auto-prefixed "worktree/")
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
   takes over the indication. Set the default mode once in
   **Settings → Plugins → Task worktree** and every new conversation starts
   that way (see [Settings](#settings)).
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

## Settings

The plugin registers the `task-worktree` settings namespace and ships its own
card in **Settings → Plugins → Plugin configuration**. One setting — the mode a
new conversation starts in — with three choices (they are exactly the three
states there are; a mode plus a separate "remember" switch would describe a
fourth one that means nothing):

| Choice in the panel | Stored in `task-worktree` | Meaning |
| --- | --- | --- |
| Local mode | `defaultMode: local`, `rememberLastChoice: false` | Every new conversation starts in the main workspace. |
| Worktree mode | `defaultMode: worktree`, `rememberLastChoice: false` | Every new conversation is isolated: the host injects the worktree-creation instruction with the first genuine message, no selector trip needed. |
| Remember the last choice | `rememberLastChoice: true` | The mode you picked last above the composer wins; `defaultMode` holds that pick. |

The default is **Local mode**. An installation that never opens the card keeps
behaving exactly as it did before this setting existed: new conversations start
in the main workspace, and a pick in the composer selector applies to its own
conversation only.

The chosen mode applies to conversations that start empty. Picking **Local mode**
in the composer selector is an explicit answer for that conversation: the host
does not auto-arm it, whatever the setting says.

Values live in the ordinary user-settings document, so they can also be set by
hand and take effect live:

```yaml
task-worktree:
  defaultMode: worktree
  rememberLastChoice: false
```

On a host without the settings service the plugin keeps working with the
composed defaults (local mode), and the card simply does not appear.

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
npm test              # smoke (worktree lifecycle) + host half + browser prefs
npm run typecheck     # client TypeScript
npm run build:client  # rebuild client/client.js (tsdown + lightningcss)
npm pack --dry-run    # inspect the tarball before publishing
```

The suites: `test/smoke.mjs` (git lifecycle on a scratch repository),
`test/host.mjs` (the real `apply()` on a fake cordis context: settings
namespace, arming policy, injection), `test/prefs.mjs` (the browser preference
store; needs Node 22.6+ and skips itself on older runtimes).

## License

MIT — see [LICENSE](LICENSE)