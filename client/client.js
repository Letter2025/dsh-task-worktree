window.__ModuleLoader__.load({ id: "dsh-task-worktree", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/client/locales.ts
/**
* Locale dictionaries for the dsh-task-worktree client half.
* Product copy is Chinese; the English side exists for parity.
*/
const zh = {
	panelTitle: "工作树",
	empty: "暂无受管理的 worktree",
	create: "新建",
	list: "列表",
	status: "状态",
	bringBack: "带回",
	remove: "删除",
	prune: "清理",
	confirm: "创建",
	cancel: "取消",
	createPlaceholder: "worktree 名字（可含 / 分层）",
	fail: "命令未执行成功",
	branch: "分支",
	path: "路径",
	dirty: "有未提交改动"
};
const en = {
	panelTitle: "Worktrees",
	empty: "No managed worktrees yet",
	create: "New",
	list: "List",
	status: "Status",
	bringBack: "Bring back",
	remove: "Remove",
	prune: "Prune",
	confirm: "Create",
	cancel: "Cancel",
	createPlaceholder: "worktree name (slashes allowed)",
	fail: "Command failed",
	branch: "Branch",
	path: "Path",
	dirty: "has uncommitted changes"
};

//#endregion
//#region \0dsh-css:C:\code\dsh-task-worktree\src\client\WorktreePanel.module.css.mjs
const css = "._3f92gG_root{background:#7f7f7f0f;border:1px solid #7f7f7f24;border-radius:8px;align-items:center;gap:10px;padding:4px 10px;font-size:12px;display:flex}._3f92gG_title{white-space:nowrap;opacity:.75;font-weight:600}._3f92gG_actions{flex-wrap:wrap;align-items:center;gap:4px;display:flex}._3f92gG_action{color:inherit;font:inherit;cursor:pointer;white-space:nowrap;opacity:.85;background:0 0;border:none;border-radius:6px;padding:3px 10px}._3f92gG_action:hover{opacity:1;background:#7f7f7f1f}._3f92gG_action:disabled{opacity:.4;cursor:default}._3f92gG_createRow{align-items:center;gap:4px;display:flex}._3f92gG_nameInput{font:inherit;color:inherit;background:0 0;border:1px solid #7f7f7f4d;border-radius:6px;min-width:180px;padding:3px 8px}._3f92gG_notice{opacity:.7;white-space:nowrap}";
const tagId = "dsh-task-worktree/WorktreePanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-task-worktree";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorktreePanel_module_css_default = {
	"action": "_3f92gG_action",
	"actions": "_3f92gG_actions",
	"createRow": "_3f92gG_createRow",
	"nameInput": "_3f92gG_nameInput",
	"notice": "_3f92gG_notice",
	"root": "_3f92gG_root",
	"title": "_3f92gG_title"
};

//#endregion
//#region src/client/WorktreePanel.tsx
/**
* WorktreePanel: the `conversation.input.dock` entry — a compact action bar
* above the composer implementing the Qoder-style worktree environment flow:
*
* - Buttons execute `/worktree ...` commands directly on the current session
*   (`ISession.command`), not clipboard copies.
* - 「新建」collects a name then runs `/worktree create <name>`; afterwards it
*   resolves the created worktree's workspace and opens a fresh session there
*   (`workspaces.startSession`) — the user lands in the isolated checkout and
*   keeps typing; the composer content naturally goes to that session.
*
* The sessions/workspaces services are injected through the plugin's apply;
* the components receive plain callbacks (AGENTS.md client discipline).
*/
/** Run one slash command on the current session; returns false on missing session or unhandled command. */
async function runCommand(injected, line) {
	const session = injected.currentSession();
	if (session === void 0) return false;
	const result = await session.command(line);
	if (!result.ok) return false;
	return result.value.matched;
}
/** Execute a command, then open the worktree workspace session for create actions. */
async function createAndOpen(injected, name$1) {
	if (!await runCommand(injected, `/worktree create ${name$1}`)) throw new Error(`create command not matched: /worktree create ${name$1}`);
	await injected.openWorktreeWorkspace(name$1);
}
function WorktreePanel(props) {
	const { t } = props;
	const [creating, setCreating] = (0, react.useState)(false);
	const [name$1, setName] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(null);
	const [notice, setNotice] = (0, react.useState)(null);
	const quickActions = [
		{
			key: "list",
			line: "/worktree list"
		},
		{
			key: "status",
			line: "/worktree status"
		},
		{
			key: "prune",
			line: "/worktree prune"
		}
	];
	const runQuick = (line) => {
		runCommand(props, line).then((ok) => {
			if (!ok) setNotice(t("fail"));
			setTimeout(() => setNotice(null), 1500);
		});
	};
	const submitCreate = () => {
		const trimmed = name$1.trim();
		if (trimmed === "" || busy !== null) return;
		setBusy("create");
		createAndOpen(props, trimmed).finally(() => {
			setBusy(null);
			setName("");
			setCreating(false);
		});
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: WorktreePanel_module_css_default.root,
		"data-testid": "worktree-panel",
		"aria-label": t("panelTitle"),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: WorktreePanel_module_css_default.title,
				children: t("panelTitle")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: WorktreePanel_module_css_default.actions,
				children: creating ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: WorktreePanel_module_css_default.createRow,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: WorktreePanel_module_css_default.nameInput,
							value: name$1,
							onChange: (e) => setName(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") submitCreate();
							},
							placeholder: t("createPlaceholder"),
							autoFocus: true
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorktreePanel_module_css_default.action,
							disabled: busy !== null,
							onClick: submitCreate,
							children: busy === "create" ? "…" : t("confirm")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorktreePanel_module_css_default.action,
							onClick: () => {
								setCreating(false);
								setName("");
							},
							children: t("cancel")
						})
					]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: WorktreePanel_module_css_default.action,
					onClick: () => setCreating(true),
					children: t("create")
				}), quickActions.map((a) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: WorktreePanel_module_css_default.action,
					onClick: () => runQuick(a.line),
					children: t(a.key)
				}, a.key))] })
			}),
			notice !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: WorktreePanel_module_css_default.notice,
				children: notice
			})
		]
	});
}

//#endregion
//#region src/client/index.ts
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
const NS = "dsh-task-worktree";
const name = "dsh-task-worktree";
const inject = [
	"slots",
	"locale",
	"sessions",
	"workspaces"
];
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), `${NS}: dictionaries`);
	const t = (key) => ctx.locale.bind(NS)(key);
	/** Resolve the current session face through the current selection id. */
	const currentSession = () => {
		const current = ctx.sessions.list.getSnapshot().current;
		if (current === void 0) return void 0;
		return ctx.sessions.binding(current)?.session;
	};
	/**
	* Open a fresh session inside the worktree's registered workspace.
	* The host-side create already registered the path under
	* `<session-cwd>/.dsh-worktrees/worktree/<name>`; workspaces.create is
	* idempotent and returns the existing workspace, whose id starts the
	* session.
	*/
	const openWorktreeWorkspace = async (name$1) => {
		const session = currentSession();
		const cwd = session !== void 0 ? session.cwd : void 0;
		if (typeof cwd !== "string" || cwd === "") throw new Error("无法确定主工作区路径");
		const path = `${cwd.replace(/[\\/]+$/u, "")}\\.dsh-worktrees\\worktree\\${name$1}`;
		const workspace = await ctx.workspaces.create({ path });
		ctx.workspaces.startSession(workspace.workspaceId);
	};
	ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
		name: "conversation.input.dock",
		id: "worktree",
		order: 10,
		locale: NS,
		inject: () => ({
			currentSession,
			openWorktreeWorkspace,
			t
		})
	}, () => (0, react.createElement)(WorktreePanel, {
		currentSession,
		openWorktreeWorkspace,
		t
	})));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;
return module.exports; } });
//# sourceMappingURL=client.js.map