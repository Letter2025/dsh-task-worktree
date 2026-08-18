# dsh-task-worktree UI 里程碑计划（v0.3）

> 目标：给插件补上 Web GUI 操作面（参考 Qoder 的 Worktree 环境选择 + 任务列表）。
> 纪律（吸取上游 dsh-git-worktree 两次翻车的教训）：先打通 client 基建并验证「注入不破坏工具通道」，
> 再逐功能叠加；全程 3081 + overlay 验证，不碰 3080。

---

## 1. 技术路径（已侦察确认，可行）

**Client bundle 构建链**（参考 ui-workspace / ui-user-questions 样板）：
- `src/client/` 写 React 组件（TypeScript），`tsdown` + 仓库的 `tsdown.client.ts` preset 构建出 `lib/client.js`（closure-factory：`window.__ModuleLoader__.load({id, factory})`）
- package.json 声明：
  ```jsonc
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" }, "client": {
    "inject": ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-runtime",
               "@deepseek-ai/dsh-client-ui-conversation", "@deepseek-ai/dsh-client-ui-sidebar"],
    "platform": "web" } },
  "exports": { "./client": "./lib/client.js", ... }
  ```
- **依赖纪律**：client 基础包全部走 `devDependencies`（构建期用，npm `next` tag = 0.1.0-rc.7 与宿主一致），**绝不进 dependencies**（双实例教训）；`@deepseek-ai/*` 仍是 peer。
- **挂载点**（slots，已确认存在于 ui-conversation）：
  - `conversation.input.dock`（list, session scope）—— todo 面板同款位置，做 worktree 操作面板
  - `conversation.chat.node`（keyed, session scope）—— 做 worktree 状态卡（工具调用后在会话流里渲染）

## 2. UI 形态（分阶段，每阶段独立验证）

| 阶段 | 内容 | 数据通道 | 验证 |
|---|---|---|---|
| **UI-1 状态卡** | `worktree_create`/`list` 后，会话流里渲染卡片（名字/分支/路径/dirty） | 工具结果 → chat.node 渲染（纯展示，无 host 改动） | 3081：注入 client 后**工具通道不坏** + 卡片出现 |
| **UI-2 操作面板** | 会话内 dock 面板：列出 worktrees + 「创建/带回/删除/刷新」按钮 | 面板按钮 → 填入 `/worktree ...` 命令文本（保守方案 A）或 host remote（完整方案 B） | 3081：点按钮 → 命令执行 → 面板刷新 |
| **UI-3 完善** | 轮询/事件刷新、中英文案、样式对齐 | — | 3081 回归 + 冒烟 |

## 3. 数据通道（关键决策，需定 A/B）

- **方案 A（先做，零 host 改动）**：面板按钮把对应 `/worktree` 命令文本填入会话输入框，用户回车执行；面板从命令回显被动刷新。
  - ✅ 基建最小、无新增 host API、无破坏风险
  - ❌ 体验打折（按钮后要再按一次回车）
- **方案 B（后续，体验完整）**：host 侧暴露 readonly worktree service（如 `ctx.worktree.list()`），client 通过官方 remote 通道直接调用；按钮即点即执行。
  - ✅ 即点即用，最接近 Qoder
  - ❌ 需要 host service + remote 接线（上游 console-host/typert 那套，工程量大、风险高）

> 建议：**UI-1→UI-2 用方案 A 跑通闭环**（先证明 UI 基建稳定），**UI-3 或 v0.4 再上方案 B**。

## 4. 里程碑顺序 + 验证门

```
M-UI0  client 基建：src/client/ 骨架 + tsdown 构建链 + dsh.client 声明
       → 3081 起服：注入后工具通道回归（pwsh 正常、worktree_create 可用）⚠️ 关键门
M-UI1  状态卡（chat.node 渲染 worktree_create 结果）→ 3081 实测卡片
M-UI2  dock 面板 + 按钮（方案 A）→ 3081 实测 create→面板→打开 isolate→带回
M-UI3  完善：文案/样式/刷新；README 更新（UI 部分）
       → npm 发布 0.3.0 → profile 升级 → 3081 全量回归
```

每步都在 3081（overlay 禁 task-board）验证，通过才进下一步；0.3.0 发布走老流程（npm publish 用户执行）。

## 5. 风险与对策

| 风险 | 对策 |
| --- | --- |
| client 注入重演"工具全挂"（wloops 前科） | M-UI0 先用**最小空 bundle**在 3081 验证注入后工具通道不坏，再写组件；根因是双实例（我们已 peer-only 免疫） |
| host/remote 通道复杂易错 | UI-2 先用方案 A（填命令文本），零 host 改动 |
| 构建链版本不匹配 | client 基础包锁 npm `next`（0.1.0-rc.7），构建后 tarball 检查 |
| Windows 换行/路径 | 沿用 autocrlf=false 惯例 |

## 6. 待确认决策点

1. **UI-2 数据通道**：先 A（填命令，保守）还是直接 B（host remote，完整）？→ 建议 A 起步
2. **面板挂载位置**：`conversation.input.dock`（todo 同款，输入区上方）是否合适？还是侧边栏？
3. **发布版本**：UI-1+2 合并发 0.3.0，还是 UI-1 先发 0.2.3？