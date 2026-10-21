# 我为什么把 dsh-task-worktree 迭代了这么多版：一个 DSH 插件的翻车、求生与重建

> 开发者博客 · 第一人称复盘
> 核心事实来自仓库内代码与设计文档（当前版本 0.4.1）；版本史以 npm registry 为准（`npm view dsh-task-worktree versions`）。

---

## 开场：一枚坏掉的插件，教会我一件事

故事得从一次"装上就能干活、装上就全挂"的插件说起。

我装了上游的 `dsh-git-worktree`（0.2.0 / 0.3.0）。功能很全：客户端 GUI、Preview 同步、回滚、review 状态机。然后在 web profile、dsh 0.1.0-rc.6、Windows 这套环境里实测——**整个会话的工具通道瘫痪了：模型每次调工具，返回结果全是空的**。所有工具调用像被吞了一样。

这不是偶发。同一条血统里的 `FlashingChen/dsh-worktree`，别人告诉我，**它曾两次搞坏会话**。两次。客户端 bundle 的注入和那个"GUI 开关"是最大嫌疑。

我当时想：要么别做 worktree 了，要么我自己写一个，**把"搞坏会话"这件事从根上设计掉**。我选了后者。然后它就迭代了 0.1.x、0.3.0、0.3.1、0.3.2，一直到现在的 0.4.1。

这篇博客讲清楚每次更迭背后到底发生了什么。

---

## 一、先搞清楚上游为什么挂：三条高危面

翻上游源码是值得的，但结论要收敛成几条可执行规则。我最后定下的三条"高危面"是：

1. **注入客户端 bundle** —— 两次崩溃的最大嫌疑；
2. **注入 system prompt** —— 和 bundle 一样，碰一次重一层风险；
3. **挂定时器** —— 生命周期不可控，崩溃时连个现场都没有。

另外，我还发现上游一个结构性弱点：它建的 worktree 是 **detached head**（`git worktree add --detach`），里面没有分支。你在里面干活、提交，提交挂在游离的 HEAD 上，收尾全靠插件维护的注册表把提交"捞"回来。状态多、路径长，任何一环对不上就 fail-closed。

这些就是我要绕开的雷区和要纠正的结构问题。规则很简单：**不该注入的绝不注入；该有分支的一定要有分支**。

---

## 二、第一版：砍到只剩服务端（`dsh-worktree-min` 0.1.x）

被上游炸过一次之后，我的第一反应是"少即是多"。于是有了 `dsh-worktree-min`：

- **纯服务端**，不注入 client bundle、不注入 system prompt、不挂定时器——三条高危面全避开；
- 模型侧只有 `worktree_create` / `worktree_list` / `worktree_ready_for_review`；
- 收尾是 review 门禁：模型把改动推到 `ready_for_review`，人工再 `finish` / `discard`；
- 注册表放在 `$DSH_HOME/plugins/dsh-worktree-min/managed.json`。

它活下来了，工具通道再也没挂过。但用户体验告诉我"极简"的代价是什么：用 worktree 要先手动打开目录作为新工作区，review 门禁流程偏重，像给一个"切个环境"的动作配了一整套审批流——**重了**。

> 这轮的收获：稳定性不靠"少写代码"保证，靠**把高风险面隔离在架构之外**。但功能砍过头，就得在下一轮还债。

---

## 三、重出方案：被用户打回一次之后，我学会了说人话

我写第一版 `PLAN.md` 时，自觉条理清晰、面面俱到。结果被打回来了，原话就三个字：**"没看懂，又长又绕。"**

于是我去把 Qoder 的官方文档、Codex 的工作区模型、Claude Code 的 `--worktree` 全读了一遍，重写了一份"大白话版"方案。核心就一张对照表：

| 别人怎么做的 | 我们在 DSH 里怎么做 |
| --- | --- |
| Qoder 面板"选 Worktree" | `/worktree create <名字>` 或 agent 调 `worktree_create` |
| Qoder "Move to local" | `/worktree bring-back <名字>`（要求主目录干净） |
| Codex 永久 worktree | `<仓库>/.dsh-worktrees/` + 仓库内 manifest，重启不丢 |
| Claude Code 会话归属 | 会话记下自己属于哪个 worktree |
| 收尾"带回/直接提交" | `bring-back` / `finish`，都只允许人工触发 |

三个我逼自己拍板的问题：

1. **收尾方式**：默认 Qoder 两式（带回 / 直接提交），review 门禁砍掉——它证明自己太慢；
2. **用后保留**：默认永久保留 + 手动 `prune`，自动清理做成可选开关；
3. **名字**：`dsh-worktree` 还是 `dsh-task-worktree`？最后定了后者——**"任务隔离"才是这个插件的语义核心**，不是"开个目录"。

方案文档本身也成了一个原则：**给开发者的文档和给用户的语言是两种语言**。用户版本要能一句话讲清主流程。

---

## 四、核心落地（0.1.x → 0.2.x）：一个 manager 打天下

0.1.x 之后，插件改名 `dsh-task-worktree`，核心开始成形。整个服务端的骨架到今天都没怎么变：

```text
lib/index.js    入口：装配 manager、注册 tools/commands、worktree mode 注入
lib/manager.js  全生命周期：create/list/status/finish/bringBack/remove/prune
lib/tools.js    模型工具面：worktree_create / worktree_list / worktree_status
lib/commands.js 人工命令面：/worktree ...
lib/git.js      双 GitRunner：生产 ctx.subprocess / 测试 child_process
lib/util.js     session cwd 解析 + renderJson
```

设计上我最得意也最坚持的几件事：

**name = 分支名 = 相对路径。** `worktree/refactor/logging` 既是分支名、又是 `.dsh-worktrees/worktree/refactor/logging` 的目录。一个名字贯穿三个概念，心智负担最小。代价是名称校验必须严格：git ref 规则、禁 `..`、禁反斜杠、段内只允许 `[A-Za-z0-9._-]`。smoke 里挂了 17 个非法名 + 5 个合法名的矩阵，路径穿越想都别想。

**模型工具面收窄。** 模型只有 create / list / status。`finish / bring-back / remove / prune` 永远只在 `/worktree` 人工命令面。实现上没有权限系统，就是"注册在两个不同的地方"——这比任何权限框架都难绕过。

**Manifest 放仓库内，原子写。** `<repo>/.dsh-worktrees/manifest.json`，tmp + rename 原子替换。版本 1，字段：`{name, path, branch, baseCommit, createdAt, createdBy, state, permanent}`。跨会话、跨重启，永久保留。文件坏掉抛 `MANIFEST_CORRUPT`，绝不静默吞。

**双 GitRunner。** 生产走 `ctx.subprocess`（harness 管进程树、管字节上限、grace 30s），测试走 `child_process.execFile`。同一个 API：`(args, cwd, signal?) => {exitCode, stdout, stderr}`。这让我能在**不启动 DSH 的情况下**跑完整生命周期冒烟测试——临时仓库里 create → commit → bring-back → remove，一条龙。

当时我没意识到的、后来反复踩的，是几个 git 的"细节中的魔鬼"，单独开一节讲。

---

## 五、补 UI（0.3.0 → 0.3.1 → 0.3.2）：最薄的一层，最多的反转

服务端稳了，就该照顾手了。UI 这块我学乖了，里程碑写得像防事故预案：

1. **M-UI0**：先做一个最小空 bundle，注入后验证**工具通道不坏**，再写组件；
2. **UI-1**：状态卡（工具结果后在会话流里渲染）；
3. **UI-2**：操作面板；
4. **UI-3**：打磨。

数据通道我一开始就定了"方案 A"：**按钮只负责把 /worktree 命令填进输入框，零 host 新 API**。方案 B（host 暴露 readonly service，client 直调）留作远期。

然后 0.3.x 的版本史基本就是 UI 手感的三个快照：

- **0.3.0 / 0.3.1**：按钮面板。0.3.1 甚至把命令**复制到剪贴板**让你手动粘贴——现在回头看，那是一个"能用但侮辱智商"的交互。
- **0.3.2**：Qoder 式工作树面板。按钮改为**直接在当前会话执行** `ISession.command`；「新建」输入名字 → 自动 `/worktree create` → 自动跳进隔离会话。这才叫"选个环境"。
- **0.4.x（当前 0.4.1）**：又一个反转——**创建 worktree 时不再注册任何工作区**，会话头部用一个**分支徽标**标记"这个对话在用哪个 worktree"，对话原地继续，模型用 checkout 的绝对路径干活。

最后一次反转是 0.3.2 的"自动开新会话"和 0.4.x 的"不切对话"之间的取舍：自动跳转很爽，但每次建一个 worktree 就往侧边栏塞一个工作区项目，用几天侧边栏就变成分支坟场。**徽标方案零副作用**：`lib/workspace.js` 现在只干一件事——remove / prune 时清理历史遗留的 workspace 注册。

> 博客式的诚实：0.3.1 的剪贴板方案和 0.3.2 的自动跳转，都是我"能跑先跑、再谈体验"的试错。迭代快不可怕，可怕的是**没有每步验证门**。我们的门是：3081 端口起服务跑一遍注入后工具通道回归，过了才进下一步。

---

## 六、Worktree mode：让"选模式"这件事自动化

UI 落地后，流程还剩最后一步要打通：用户不该记得"先调 worktree_create"。

于是有了 `/worktree mode-on [name]`：

1. 空白对话、发送前，dock 选择器选「Worktree 模式」（分支名可选，自动补 `worktree/` 前缀）；
2. 会话被放进 `armed Map<agentId, name>`；
3. **首条真正用户消息**进来时，`agent/inbox/inserted` 触发，往消息流里注入一条 `form:'instructions'` 的上下文块——内容就一句话：本轮先调 `worktree_create`，在返回的 checkout 绝对路径里干活，结束给出可复制的收尾命令；
4. 注入完立即 unarm。只注入一次，且**只认 `source.kind === 'user'`**——工具结果、系统上下文永远不会触发二次注入。

这里有个值得分享的细节：注入不是写进 system prompt，而是 **`agent.inject(createUserMessage(...))`** 拼在用户消息前。它让模型"这一轮就知道要建 worktree"，又不污染全局上下文。

---

## 七、git 的细节之魔鬼：carry-uncommitted 的三连坑

"把主工作区未提交改动带进新 worktree"这个功能，我踩了一串让人血压升高的坑，值得单独写：

1. **patch 不能从 stdin 进来。** `git apply` 读 stdin 时，父进程管道没关就会永久阻塞子进程。必须把 `git diff --binary HEAD` 写进临时 patch 文件，再 `git apply <file>`；
2. **patch 尾换行不能丢。** 我最初的 runner 会把 stdout trim 掉，结果是最后一块 hunk 粘到 EOF，`git apply` 判整份 patch 损坏。修复是把 runner 加个 `opts.raw`，保留原样；
3. **Windows autocrlf 会改写 carried 文件。** 触发器：测试 fixture 里 `core.autocrlf=false`，否则拷进 worktree 的文件全部变 CRLF，diff 一塌糊涂。

每条都是"日志里一个 5 分钟能查到的怪现象"，但凑在一起就是半天。写完这功能我最大的感想是：**给 git 传数据，永远不要信任"看起来等价"的文本管道**。

---

## 八、为什么 @deepseek-ai/* 只能进 peerDependencies

这是从两次翻车里提炼出的最硬一条纪律：

> 插件只要把 `@deepseek-ai/*` 装进 profile 造成**双实例**，就会破坏 `TOOL_RUNTIME_SCHEDULER` 的 unique symbol——工具通道整体失效，连个报错都不给你。

所以：

- 所有 `@deepseek-ai/*` 只进 `peerDependencies`，范围 `^0.1.0-rc.7`（裸 `"*"` 匹配不上 pre-release，这是另一个坑）；
- client 侧基础包和 react 进 `devDependencies`，构建期用，npm `next` tag（与宿主 rc 对齐）；
- bundle 的 externals 只有三个：react / react-jsx-runtime / dsh-client-ui-primitives。

发布时还有一条配套纪律：**`publish.mjs` 6 步门禁里，`npm pack --dry-run` 会查泄露**——`src/`、`test/`、`scripts/`、UI-PLAN.md、图片、.npmrc、.tgz 一个都不许进包；真实发布必须走 TTY 完成 npm 2FA。镜像 registry 的坑（publish E403、view 显示旧版本）由 `--registry https://registry.npmjs.org` 显式规避。

---

## 九、现在的架构是什么样的（0.4.1 快照）

```text
Web GUI (src/client)                Host (lib/)
WorktreePanel ──session.command()──▶ /worktree mode-on [name]
WorktreeBadge ◀──store.declare()──┘   (armed Map)
首条用户消息 ──▶ agent/inbox/inserted ──▶ agent.inject(instructions)
                                          ▼
                                  模型调 worktree_create
                                          ▼
                              WorktreeManager (lib/manager.js)
                              manifest.json 原子写 + gitRunner
```

不变量三句话：

1. 一个会话 = 一个固定 cwd；"在 worktree 里干活" = 模型用 checkout 的绝对路径，或打开该路径作为隔离会话；
2. 模型永远摸不到收尾命令；`finish / bring-back / remove / prune` 只在人工命令面；
3. 持久化唯一真相 = 磁盘 checkout + 仓库内 manifest；workspace 注册只是便利，不是事实。

---

## 十、踩坑总表（给后来者）

| 坑 | 对策 |
| --- | --- |
| client bundle / system prompt / 定时器注入过重 → 工具通道全挂 | 三高危面全部回避；UI 只挂两个薄 slot；3081 注入后回归 |
| `"*"` peer 不匹配 rc 版本 | peer 全用 `^0.1.0-rc.7` |
| 双实例破坏 `TOOL_RUNTIME_SCHEDULER` unique symbol | @deepseek-ai/* 只进 peerDependencies |
| `git apply` 从 stdin 读 patch 阻塞 | patch 落临时文件 |
| patch 尾换行被 trim → 判损坏 | `opts.raw` |
| Windows autocrlf 改写文件 | fixture 强制 `core.autocrlf=false` |
| 镜像 registry：publish E403 / view 旧版本 | 显式官方 registry |
| npm 2FA 非交互脱敏 | publish 脚本强制 TTY |
| `lib/` 或 `client.js` 过期/忘提交 | prepublishOnly 跑 test+build；CI `git diff --exit-code -- client` |
| 名称路径穿越 / ref 非法 | `isValidRefName` + smoke 名字矩阵 |

---

## 最后：如果让我重写一遍，我会怎么走

不会更快，但会更早拦下三个决定：

1. **UI 永远等核心稳定再动**。0.3.x 的两次 UI 反转不是白费，但如果有"先最小 bundle 验证注入安全"这道门，0.3.1 的剪贴板方案根本不该出现；
2. **状态机别急着加**。review 门禁、自动清理、护栏这些"可选门控"最后全被砍成"规划里的开关"。先做主线：create → 干活 → bring-back/finish → remove；
3. **版本史要从第一天就写进 CHANGELOG**。这个插件迭代了这么多版，最容易被丢的不是代码，是"每个版本为什么存在"。现在补还来得及。

最后一条实操建议：**本地装插件用目录直连（`dsh plugin --profile web add <dir>`），改代码即时生效**；发布前跑 `npm run release:check`，让 6 步门禁替你把关。

---

*致后来者：如果这份文档能留你一个下午，我希望你带走的是这一句——在 DSH 上做插件，稳定性不是功能列表的附属品，而是架构的第一优先级。环境和你之间，隔着一层你一碰就碎的信任。*
