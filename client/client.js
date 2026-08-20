window.__ModuleLoader__.load({ id: "dsh-task-worktree", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
let react = require("react");
let __deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/client/locales.ts
/**
* Locale dictionaries for the dsh-task-worktree client half.
* Product copy is Chinese; the English side exists for parity.
*/
const zh = {
	panelTitle: "工作树",
	localMode: "本地模式",
	worktreeMode: "Worktree模式",
	manage: "Worktree 管理",
	back: "返回",
	switching: "正在切换…",
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
	localMode: "Local mode",
	worktreeMode: "Worktree mode",
	manage: "Manage worktrees",
	back: "Back",
	switching: "Switching…",
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
const css = "._3f92gG_root{z-index:8;box-sizing:border-box;width:min(var(--dsh-composer-card-max-width,780px), calc(100% - 32px));min-height:28px;color:var(--dsw-alias-label-primary,#1f1f1f);pointer-events:none;align-self:center;align-items:center;padding-left:8px;font-size:13px;display:flex;position:relative}._3f92gG_trigger{min-height:28px;color:inherit;font:inherit;white-space:nowrap;cursor:pointer;pointer-events:auto;background:0 0;border:0;border-radius:6px;align-items:center;gap:5px;padding:4px 7px;font-weight:500;line-height:18px;display:inline-flex}._3f92gG_trigger:hover,._3f92gG_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}._3f92gG_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_menuItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_backButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_secondaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_primaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_nameInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}._3f92gG_icon{color:var(--dsw-alias-label-secondary,#5f6368);flex:none}._3f92gG_chevron{color:var(--dsw-alias-label-caption,#8a8f98);flex:none;transition:transform .14s}._3f92gG_chevronOpen{transform:rotate(180deg)}._3f92gG_popover{z-index:60;width:168px;color:var(--dsw-alias-label-primary,#1f1f1f);background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,#0000001f);pointer-events:auto;border-radius:7px;padding:4px;position:absolute;top:calc(100% + 6px);left:8px;overflow:hidden;box-shadow:0 10px 28px #00000021,0 2px 8px #00000014}._3f92gG_menuItem{width:100%;min-height:32px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:5px;grid-template-columns:16px minmax(0,1fr) 14px;align-items:center;gap:7px;padding:6px 8px;font-weight:400;line-height:18px;display:grid}._3f92gG_menuItem>span{text-overflow:ellipsis;white-space:nowrap;grid-column:2;overflow:hidden}._3f92gG_menuItem:hover,._3f92gG_menuItem._3f92gG_selected{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}._3f92gG_menuItem:disabled{cursor:default;opacity:.5}._3f92gG_menuItem._3f92gG_danger{color:var(--dsw-alias-state-error,#c93b3b)}._3f92gG_menuItem._3f92gG_danger ._3f92gG_icon{color:currentColor}._3f92gG_trailingIcon{color:var(--dsw-alias-label-caption,#8a8f98);grid-column:3;justify-self:end}._3f92gG_separator{background:var(--dsw-alias-border-l2,#0000001a);height:1px;margin:4px 6px}._3f92gG_menuHeader{border-bottom:1px solid var(--dsw-alias-border-l2,#0000001a);align-items:center;gap:5px;min-height:32px;margin-bottom:4px;padding:4px 6px 5px 4px;font-weight:600;display:flex}._3f92gG_backButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary,#5f6368);cursor:pointer;background:0 0;border:0;border-radius:5px;flex:none;place-items:center;padding:0;display:inline-grid}._3f92gG_backButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}._3f92gG_createPanel{width:272px}._3f92gG_popover:has(._3f92gG_createPanel){width:280px}._3f92gG_nameInput{box-sizing:border-box;width:calc(100% - 12px);height:34px;color:inherit;font:inherit;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l1,#0003);border-radius:6px;margin:7px 6px 9px;padding:6px 9px}._3f92gG_nameInput::placeholder{color:var(--dsw-alias-label-caption,#8a8f98)}._3f92gG_createActions{justify-content:flex-end;gap:6px;padding:0 6px 5px;display:flex}._3f92gG_secondaryButton,._3f92gG_primaryButton{min-height:28px;font:inherit;cursor:pointer;border-radius:6px;padding:4px 11px}._3f92gG_secondaryButton{color:inherit;border:1px solid var(--dsw-alias-border-l2,#0000001f);background:0 0}._3f92gG_secondaryButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}._3f92gG_primaryButton{color:#fff;background:var(--dsw-alias-state-business-primary,#4f73ff);border:1px solid #0000}._3f92gG_primaryButton:disabled{cursor:default;opacity:.45}._3f92gG_notice{color:var(--dsw-alias-state-error,#c93b3b);white-space:nowrap;pointer-events:auto;margin-left:6px;font-size:12px}[data-phase=hero] ._3f92gG_root{padding-left:var(--worktree-hero-inset,204px);margin-top:-34px}[data-phase=hero] ._3f92gG_popover{left:var(--worktree-hero-inset,204px)}@media (max-width:720px){._3f92gG_root{width:calc(100% - 20px);padding-left:0}._3f92gG_popover{left:0}}";
const tagId = "dsh-task-worktree/WorktreePanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-task-worktree";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorktreePanel_module_css_default = {
	"backButton": "_3f92gG_backButton",
	"chevron": "_3f92gG_chevron",
	"chevronOpen": "_3f92gG_chevronOpen",
	"createActions": "_3f92gG_createActions",
	"createPanel": "_3f92gG_createPanel",
	"danger": "_3f92gG_danger",
	"icon": "_3f92gG_icon",
	"menuHeader": "_3f92gG_menuHeader",
	"menuItem": "_3f92gG_menuItem",
	"nameInput": "_3f92gG_nameInput",
	"notice": "_3f92gG_notice",
	"popover": "_3f92gG_popover",
	"primaryButton": "_3f92gG_primaryButton",
	"root": "_3f92gG_root",
	"secondaryButton": "_3f92gG_secondaryButton",
	"selected": "_3f92gG_selected",
	"separator": "_3f92gG_separator",
	"trailingIcon": "_3f92gG_trailingIcon",
	"trigger": "_3f92gG_trigger"
};

//#endregion
//#region src/client/WorktreePanel.tsx
/**
* Compact local/worktree mode selector mounted above the composer.
*
* The closed state mirrors the host's metadata controls. Existing worktree
* commands remain available from the management view inside the popover.
*/
const WORKTREE_PATH = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u;
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
function currentMode(injected) {
	const cwd = injected.currentCwd();
	return typeof cwd === "string" && WORKTREE_PATH.test(cwd) ? "worktree" : "local";
}
function WorktreePanel(props) {
	const { t } = props;
	const rootRef = (0, react.useRef)(null);
	const [open, setOpen] = (0, react.useState)(false);
	const [view, setView] = (0, react.useState)("mode");
	const [name$1, setName] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(null);
	const [notice, setNotice] = (0, react.useState)(null);
	const mode = currentMode(props);
	(0, react.useLayoutEffect)(() => {
		const root = rootRef.current;
		const heroRow = root?.parentElement?.previousElementSibling;
		if (root === null || root === void 0 || !(heroRow instanceof HTMLElement) || root.closest("[data-phase=\"hero\"]") === null) {
			root?.style.removeProperty("--worktree-hero-inset");
			return;
		}
		const updateInset = () => {
			const rootRect = root.getBoundingClientRect();
			const rightEdge = Array.from(heroRow.querySelectorAll("*")).reduce((right, element) => {
				const rect = element.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0 ? Math.max(right, rect.right) : right;
			}, rootRect.left);
			const inset = Math.max(0, Math.ceil(rightEdge - rootRect.left + 6));
			root.style.setProperty("--worktree-hero-inset", `${inset}px`);
		};
		updateInset();
		const resizeObserver = new ResizeObserver(updateInset);
		const mutationObserver = new MutationObserver(updateInset);
		resizeObserver.observe(heroRow);
		mutationObserver.observe(heroRow, {
			childList: true,
			subtree: true,
			characterData: true
		});
		window.addEventListener("resize", updateInset);
		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener("resize", updateInset);
		};
	}, []);
	const closeMenu = () => {
		setOpen(false);
		setView("mode");
		setName("");
	};
	(0, react.useEffect)(() => {
		if (!open) return;
		const onPointerDown = (event) => {
			if (rootRef.current?.contains(event.target) !== true) closeMenu();
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") closeMenu();
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);
	const showFailure = () => {
		setNotice(t("fail"));
		window.setTimeout(() => setNotice(null), 1800);
	};
	const runQuick = (line) => {
		if (busy !== null) return;
		setBusy(line);
		runCommand(props, line).then((ok) => {
			if (!ok) showFailure();
			closeMenu();
		}).finally(() => {
			setBusy(null);
		});
	};
	const submitCreate = () => {
		const trimmed = name$1.trim();
		if (trimmed === "" || busy !== null) return;
		setBusy("create");
		createAndOpen(props, trimmed).then(() => {
			closeMenu();
		}).catch(() => {
			showFailure();
		}).finally(() => {
			setBusy(null);
			setName("");
		});
	};
	const switchLocal = () => {
		if (busy !== null) return;
		if (mode === "local") {
			closeMenu();
			return;
		}
		setBusy("local");
		props.openLocalWorkspace().then(() => {
			closeMenu();
		}).catch(() => {
			showFailure();
		}).finally(() => {
			setBusy(null);
		});
	};
	const toggleMenu = () => {
		setOpen((value) => !value);
		setView("mode");
		setName("");
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: WorktreePanel_module_css_default.root,
		"data-testid": "worktree-panel",
		"data-mode": mode,
		"aria-label": t("panelTitle"),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: WorktreePanel_module_css_default.trigger,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				onClick: toggleMenu,
				children: [
					mode === "worktree" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
						size: 14,
						className: WorktreePanel_module_css_default.icon
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {
						size: 14,
						className: WorktreePanel_module_css_default.icon
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: mode === "worktree" ? t("worktreeMode") : t("localMode") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {
						size: 12,
						className: `${WorktreePanel_module_css_default.chevron} ${open ? WorktreePanel_module_css_default.chevronOpen : ""}`
					})
				]
			}),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorktreePanel_module_css_default.popover,
				role: "menu",
				"data-testid": "worktree-mode-menu",
				children: [
					view === "mode" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitemradio",
							"aria-checked": mode === "local",
							className: `${WorktreePanel_module_css_default.menuItem} ${mode === "local" ? WorktreePanel_module_css_default.selected : ""}`,
							disabled: busy !== null,
							onClick: switchLocal,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: busy === "local" ? t("switching") : t("localMode") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitemradio",
							"aria-checked": mode === "worktree",
							className: `${WorktreePanel_module_css_default.menuItem} ${mode === "worktree" ? WorktreePanel_module_css_default.selected : ""}`,
							disabled: busy !== null,
							onClick: () => {
								if (mode === "worktree") closeMenu();
								else setView("create");
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("worktreeMode") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: WorktreePanel_module_css_default.separator,
							role: "separator"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: WorktreePanel_module_css_default.menuItem,
							onClick: () => setView("actions"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {
									size: 14,
									className: WorktreePanel_module_css_default.icon
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("manage") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {
									size: 12,
									className: WorktreePanel_module_css_default.trailingIcon
								})
							]
						})
					] }),
					view === "actions" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: WorktreePanel_module_css_default.menuHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorktreePanel_module_css_default.backButton,
								"aria-label": t("back"),
								onClick: () => setView("mode"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, { size: 13 })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("manage") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: WorktreePanel_module_css_default.menuItem,
							onClick: () => setView("create"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("create") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: WorktreePanel_module_css_default.menuItem,
							onClick: () => runQuick("/worktree list"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("list") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: WorktreePanel_module_css_default.menuItem,
							onClick: () => runQuick("/worktree status"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconGoalOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: `${WorktreePanel_module_css_default.menuItem} ${WorktreePanel_module_css_default.danger}`,
							onClick: () => runQuick("/worktree prune"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {
								size: 14,
								className: WorktreePanel_module_css_default.icon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("prune") })]
						})
					] }),
					view === "create" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorktreePanel_module_css_default.createPanel,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: WorktreePanel_module_css_default.menuHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorktreePanel_module_css_default.backButton,
									"aria-label": t("back"),
									onClick: () => setView("mode"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, { size: 13 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("create") })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: WorktreePanel_module_css_default.nameInput,
								value: name$1,
								onChange: (event) => setName(event.target.value),
								onKeyDown: (event) => {
									if (event.key === "Enter") submitCreate();
								},
								placeholder: t("createPlaceholder"),
								autoFocus: true
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: WorktreePanel_module_css_default.createActions,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorktreePanel_module_css_default.secondaryButton,
									onClick: () => setView("mode"),
									children: t("cancel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorktreePanel_module_css_default.primaryButton,
									disabled: name$1.trim() === "" || busy !== null,
									onClick: submitCreate,
									children: busy === "create" ? "…" : t("confirm")
								})]
							})
						]
					})
				]
			}),
			notice !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: WorktreePanel_module_css_default.notice,
				role: "status",
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
	/** Resolve the current cwd from the list summary (the outward session face intentionally omits it). */
	const currentCwd = () => {
		const snapshot = ctx.sessions.list.getSnapshot();
		return snapshot.current !== void 0 ? snapshot.byId[snapshot.current]?.cwd : void 0;
	};
	/** Open the local workspace that owns the current worktree checkout. */
	const openLocalWorkspace = async () => {
		const cwd = currentCwd();
		if (typeof cwd !== "string" || cwd === "") throw new Error("无法确定当前工作区路径");
		const marker = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u.exec(cwd);
		const localPath = marker !== null ? cwd.slice(0, marker.index) : cwd;
		const workspace = await ctx.workspaces.create({ path: localPath });
		ctx.workspaces.startSession(workspace.workspaceId);
	};
	/**
	* Open a fresh session inside the worktree's registered workspace.
	* The host-side create already registered the path under
	* `<session-cwd>/.dsh-worktrees/worktree/<name>`; workspaces.create is
	* idempotent and returns the existing workspace, whose id starts the
	* session.
	*/
	const openWorktreeWorkspace = async (name$1) => {
		const cwd = currentCwd();
		if (typeof cwd !== "string" || cwd === "") throw new Error("无法确定主工作区路径");
		const path = `${cwd.replace(/[\\/]+$/u, "")}\\.dsh-worktrees\\worktree\\${name$1}`;
		const workspace = await ctx.workspaces.create({ path });
		ctx.workspaces.startSession(workspace.workspaceId);
	};
	ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
		name: "conversation.input.dock",
		id: "worktree",
		order: 10,
		locale: NS
	}, () => (0, react.createElement)(WorktreePanel, {
		currentSession,
		currentCwd,
		openLocalWorkspace,
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