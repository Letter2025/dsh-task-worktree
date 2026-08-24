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
	switching: "正在切换…",
	fail: "命令未执行成功",
	badgeTooltip: "本对话使用的 worktree",
	badgeFallback: "worktree",
	heroStartLabel: "分支名：",
	heroStartPlaceholder: "可选，留空由 AI 命名"
};
const en = {
	panelTitle: "Worktrees",
	localMode: "Local mode",
	worktreeMode: "Worktree mode",
	switching: "Switching…",
	fail: "Command failed",
	badgeTooltip: "Worktree used by this conversation",
	badgeFallback: "worktree",
	heroStartLabel: "Branch: ",
	heroStartPlaceholder: "optional; blank: AI proposes"
};

//#endregion
//#region src/client/worktreeLedger.ts
/** Registry path marker: <root>/.dsh-worktrees/worktree/<name...>. */
const WORKTREE_PATH$1 = /[\\/]\.dsh-worktrees[\\/]worktree[\\/](.+)$/u;
/**
* Derive the worktree name from a session cwd running inside a managed
* checkout, or undefined for a local session.
*/
function worktreeNameOfCwd(cwd) {
	if (typeof cwd !== "string" || cwd === "") return void 0;
	const match = WORKTREE_PATH$1.exec(cwd);
	return match === null ? void 0 : match[1].replace(/[\\/]+$/u, "");
}

//#endregion
//#region \0dsh-css:src/client/WorktreePanel.module.css.mjs
const css = ".Y0CJ8q_root{z-index:8;box-sizing:border-box;width:min(var(--dsh-composer-card-max-width,780px), calc(100% - 32px));min-height:28px;color:var(--dsw-alias-label-primary,#1f1f1f);pointer-events:none;align-self:center;align-items:center;padding-left:8px;font-size:13px;display:flex;position:relative}.Y0CJ8q_trigger{min-height:28px;color:inherit;font:inherit;white-space:nowrap;cursor:pointer;pointer-events:auto;background:0 0;border:0;border-radius:6px;align-items:center;gap:5px;padding:4px 7px;font-weight:500;line-height:18px;display:inline-flex}.Y0CJ8q_trigger:hover,.Y0CJ8q_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_menuItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_backButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_secondaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_primaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_nameInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_icon{color:var(--dsw-alias-label-secondary,#5f6368);flex:none}.Y0CJ8q_chevron{color:var(--dsw-alias-label-caption,#8a8f98);flex:none;transition:transform .14s}.Y0CJ8q_chevronOpen{transform:rotate(180deg)}.Y0CJ8q_popover{z-index:60;width:168px;color:var(--dsw-alias-label-primary,#1f1f1f);background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,#0000001f);pointer-events:auto;border-radius:7px;padding:4px;position:absolute;top:calc(100% + 6px);left:8px;overflow:hidden;box-shadow:0 10px 28px #00000021,0 2px 8px #00000014}.Y0CJ8q_menuItem{width:100%;min-height:32px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:5px;grid-template-columns:16px minmax(0,1fr) 14px;align-items:center;gap:7px;padding:6px 8px;font-weight:400;line-height:18px;display:grid}.Y0CJ8q_menuItem>span{text-overflow:ellipsis;white-space:nowrap;grid-column:2;overflow:hidden}.Y0CJ8q_menuItem:hover,.Y0CJ8q_menuItem.Y0CJ8q_selected{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_menuItem:disabled{cursor:default;opacity:.5}.Y0CJ8q_menuItem.Y0CJ8q_danger{color:var(--dsw-alias-state-error,#c93b3b)}.Y0CJ8q_menuItem.Y0CJ8q_danger .Y0CJ8q_icon{color:currentColor}.Y0CJ8q_trailingIcon{color:var(--dsw-alias-label-caption,#8a8f98);grid-column:3;justify-self:end}.Y0CJ8q_separator{background:var(--dsw-alias-border-l2,#0000001a);height:1px;margin:4px 6px}.Y0CJ8q_menuHeader{border-bottom:1px solid var(--dsw-alias-border-l2,#0000001a);align-items:center;gap:5px;min-height:32px;margin-bottom:4px;padding:4px 6px 5px 4px;font-weight:600;display:flex}.Y0CJ8q_backButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary,#5f6368);cursor:pointer;background:0 0;border:0;border-radius:5px;flex:none;place-items:center;padding:0;display:inline-grid}.Y0CJ8q_backButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_createPanel{width:272px}.Y0CJ8q_popover:has(.Y0CJ8q_createPanel){width:280px}.Y0CJ8q_nameInput{box-sizing:border-box;width:calc(100% - 12px);height:34px;color:inherit;font:inherit;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l1,#0003);border-radius:6px;margin:7px 6px 9px;padding:6px 9px}.Y0CJ8q_nameInput::placeholder{color:var(--dsw-alias-label-caption,#8a8f98)}.Y0CJ8q_createActions{justify-content:flex-end;gap:6px;padding:0 6px 5px;display:flex}.Y0CJ8q_secondaryButton,.Y0CJ8q_primaryButton{min-height:28px;font:inherit;cursor:pointer;border-radius:6px;padding:4px 11px}.Y0CJ8q_secondaryButton{color:inherit;border:1px solid var(--dsw-alias-border-l2,#0000001f);background:0 0}.Y0CJ8q_secondaryButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_primaryButton{color:#fff;background:var(--dsw-alias-state-business-primary,#4f73ff);border:1px solid #0000}.Y0CJ8q_primaryButton:disabled{cursor:default;opacity:.45}.Y0CJ8q_notice{color:var(--dsw-alias-state-error,#c93b3b);white-space:nowrap;pointer-events:auto;margin-left:6px;font-size:12px}.Y0CJ8q_badge{max-width:200px;min-height:20px;color:var(--dsw-alias-label-secondary,#5f6368);white-space:nowrap;border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:999px;align-items:center;gap:4px;padding:1px 7px;font-size:11px;line-height:16px;display:inline-flex;overflow:hidden}.Y0CJ8q_badge>span{text-overflow:ellipsis;overflow:hidden}.Y0CJ8q_badgeIcon{color:var(--dsw-alias-state-business-primary,#4f73ff);flex:none}.Y0CJ8q_heroStart{border:1px dashed var(--dsw-alias-border-l2,#00000029);pointer-events:auto;border-radius:7px;align-items:center;gap:6px;min-height:28px;margin-left:6px;padding:2px 6px 2px 4px;display:inline-flex}.Y0CJ8q_heroStartLabel{white-space:nowrap;font-weight:500}.Y0CJ8q_heroStartInput{box-sizing:border-box;width:230px;height:26px;color:inherit;font:inherit;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l1,#0003);border-radius:6px;padding:3px 8px}.Y0CJ8q_heroStartInput::placeholder{color:var(--dsw-alias-label-caption,#8a8f98)}.Y0CJ8q_heroStartButton{color:#fff;min-height:26px;font:inherit;cursor:pointer;background:var(--dsw-alias-state-business-primary,#4f73ff);border:1px solid #0000;border-radius:6px;padding:3px 12px;font-weight:500}.Y0CJ8q_heroStartButton:disabled{cursor:default;opacity:.45}.Y0CJ8q_armedCancel{min-height:26px;color:inherit;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#0000001f);background:0 0;border-radius:6px;padding:3px 12px}.Y0CJ8q_armedCancel:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_armedCancel:disabled{cursor:default;opacity:.45}.Y0CJ8q_commandRow{color:var(--dsw-alias-label-primary,#1f1f1f);flex-direction:column;gap:2px;padding:4px 0;font-size:12px;line-height:17px;display:flex}.Y0CJ8q_commandRowLine{word-break:break-all;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:600}.Y0CJ8q_commandRowOutcome{color:var(--dsw-alias-label-secondary,#5f6368);white-space:pre-wrap;word-break:break-word}.Y0CJ8q_commandRowError{color:var(--dsw-alias-state-error,#c93b3b)}[data-phase=hero] .Y0CJ8q_root{flex:none;align-self:flex-start;width:auto;max-width:calc(100% - 32px);padding-left:20px;display:inline-flex}[data-phase=hero] .Y0CJ8q_popover{left:20px}@media (max-width:720px){.Y0CJ8q_root{width:calc(100% - 20px);padding-left:0}.Y0CJ8q_popover{left:0}}";
const tagId = "dsh-task-worktree/WorktreePanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-task-worktree";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorktreePanel_module_css_default = {
	"armedCancel": "Y0CJ8q_armedCancel",
	"backButton": "Y0CJ8q_backButton",
	"badge": "Y0CJ8q_badge",
	"badgeIcon": "Y0CJ8q_badgeIcon",
	"chevron": "Y0CJ8q_chevron",
	"chevronOpen": "Y0CJ8q_chevronOpen",
	"commandRow": "Y0CJ8q_commandRow",
	"commandRowError": "Y0CJ8q_commandRowError",
	"commandRowLine": "Y0CJ8q_commandRowLine",
	"commandRowOutcome": "Y0CJ8q_commandRowOutcome",
	"createActions": "Y0CJ8q_createActions",
	"createPanel": "Y0CJ8q_createPanel",
	"danger": "Y0CJ8q_danger",
	"heroStart": "Y0CJ8q_heroStart",
	"heroStartButton": "Y0CJ8q_heroStartButton",
	"heroStartInput": "Y0CJ8q_heroStartInput",
	"heroStartLabel": "Y0CJ8q_heroStartLabel",
	"icon": "Y0CJ8q_icon",
	"menuHeader": "Y0CJ8q_menuHeader",
	"menuItem": "Y0CJ8q_menuItem",
	"nameInput": "Y0CJ8q_nameInput",
	"notice": "Y0CJ8q_notice",
	"popover": "Y0CJ8q_popover",
	"primaryButton": "Y0CJ8q_primaryButton",
	"root": "Y0CJ8q_root",
	"secondaryButton": "Y0CJ8q_secondaryButton",
	"selected": "Y0CJ8q_selected",
	"separator": "Y0CJ8q_separator",
	"trailingIcon": "Y0CJ8q_trailingIcon",
	"trigger": "Y0CJ8q_trigger"
};

//#endregion
//#region src/client/WorktreeBadge.tsx
/**
* Conversation-header worktree badge: renders a branch icon next to the
* session title when this conversation is in worktree mode — declared via
* start-in-worktree-mode (store) or running inside a checkout (cwd). Marks
* the conversation in the Qoder style without consuming a workspace entry.
*/
/** Render the branch badge; nothing when the staged conversation has no worktree. */
function WorktreeBadge(props) {
	const { currentCwd, store, t } = props;
	(0, react.useSyncExternalStore)(store.subscribe, store.getVersion);
	const sessionId = props.sessionIdOf();
	const cwdName = worktreeNameOfCwd(currentCwd());
	const declared = store.stateOf(sessionId);
	const fallback = declared.worktree ? t("badgeFallback") : void 0;
	const name$1 = declared.name ?? cwdName ?? fallback;
	window.__dshTaskWorktreeDebug = {
		sessionId,
		declared: declared.name,
		declaredWorktree: declared.worktree,
		cwd: cwdName,
		label: name$1
	};
	if (name$1 === void 0) return null;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: WorktreePanel_module_css_default.badge,
		role: "status",
		title: `${t("badgeTooltip")}: ${name$1}`,
		"data-testid": "worktree-badge",
		"data-worktree": name$1,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
			size: 13,
			className: WorktreePanel_module_css_default.badgeIcon
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: name$1 })]
	});
}

//#endregion
//#region src/client/WorktreePanel.tsx
/**
* Compact local/worktree mode selector mounted above the composer.
*
* Selecting Worktree mode arms the host (the creation instruction rides the
* next user message); the revealed strip optionally takes a name (Enter to
* apply). Selecting Local mode disarms. Management commands (/worktree
* list/status/...) stay available from the composer directly.
*/
const WORKTREE_PATH = /[\\/]\.dsh-worktrees[\\/]worktree[\\/]/u;
function currentMode(injected) {
	const cwd = injected.currentCwd();
	return typeof cwd === "string" && WORKTREE_PATH.test(cwd) ? "worktree" : "local";
}
function WorktreePanel(props) {
	const { t, store, sessionIdOf } = props;
	const rootRef = (0, react.useRef)(null);
	const [open, setOpen] = (0, react.useState)(false);
	const [name$1, setName] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(null);
	const [notice, setNotice] = (0, react.useState)(null);
	const nameTimer = (0, react.useRef)(void 0);
	/** Last raw name actually sent to the host (dedup guard for re-arms). */
	const lastAppliedRef = (0, react.useRef)("");
	(0, react.useSyncExternalStore)(store.subscribe, store.getVersion);
	const sessionId = sessionIdOf();
	const declared = store.stateOf(sessionId);
	const hero = props.currentBlank();
	const mode = declared.worktree || currentMode(props) === "worktree" ? "worktree" : "local";
	(0, react.useEffect)(() => {
		setName(declared.name ?? "");
	}, [declared.name]);
	(0, react.useEffect)(() => () => {
		if (nameTimer.current !== void 0) window.clearTimeout(nameTimer.current);
	}, []);
	window.__dshTaskWorktreePanelDebug = {
		sessionId,
		mode,
		hero,
		declaredWorktree: declared.worktree
	};
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
	/** Legacy: leave a session actually running inside a worktree checkout. */
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
	};
	/** 本地模式 radio: disarm the declared worktree mode, or leave a legacy checkout session. */
	const selectLocal = () => {
		if (busy !== null) return;
		if (declared.worktree) {
			disarmMode();
			closeMenu();
			return;
		}
		if (mode === "worktree") {
			switchLocal();
			return;
		}
		closeMenu();
	};
	/** Commit the typed worktree name: re-arms the host with that name (mode-on
	* is idempotent; the pending name simply updates). Debounced at 900ms and
	* deduplicated against the previously applied value — a single typing run
	* produces at most ONE command row in the conversation, not one per pause. */
	const applyName = (value) => {
		setName(value);
		const trimmed = value.trim();
		if (trimmed === lastAppliedRef.current) return;
		if (nameTimer.current !== void 0) window.clearTimeout(nameTimer.current);
		nameTimer.current = window.setTimeout(() => {
			nameTimer.current = void 0;
			if (busy !== null) return;
			lastAppliedRef.current = trimmed;
			props.armWorktreeMode(trimmed === "" ? void 0 : trimmed).catch(() => {
				lastAppliedRef.current = "";
				showFailure();
			});
		}, 900);
	};
	const disarmMode = () => {
		if (busy !== null) return;
		setBusy("disarmMode");
		props.disarmWorktreeMode().catch(() => {
			showFailure();
		}).finally(() => {
			setBusy(null);
		});
	};
	if (!hero) return null;
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
			declared.worktree && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorktreePanel_module_css_default.heroStart,
				"data-testid": "worktree-mode-start",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
						size: 14,
						className: WorktreePanel_module_css_default.icon
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: WorktreePanel_module_css_default.heroStartLabel,
						children: t("heroStartLabel")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: WorktreePanel_module_css_default.heroStartInput,
						value: name$1,
						onChange: (event) => applyName(event.target.value),
						placeholder: t("heroStartPlaceholder"),
						"aria-label": t("heroStartPlaceholder"),
						disabled: busy !== null
					})
				]
			}),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorktreePanel_module_css_default.popover,
				role: "menu",
				"data-testid": "worktree-mode-menu",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitemradio",
					"aria-checked": mode === "local",
					className: `${WorktreePanel_module_css_default.menuItem} ${mode === "local" ? WorktreePanel_module_css_default.selected : ""}`,
					disabled: busy !== null,
					onClick: selectLocal,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {
						size: 14,
						className: WorktreePanel_module_css_default.icon
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: busy === "local" ? t("switching") : t("localMode") })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitemradio",
					"aria-checked": mode === "worktree",
					className: `${WorktreePanel_module_css_default.menuItem} ${mode === "worktree" ? WorktreePanel_module_css_default.selected : ""}`,
					disabled: busy !== null,
					onClick: () => {
						if (!declared.worktree) props.armWorktreeMode(void 0).catch(() => showFailure());
						closeMenu();
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
						size: 14,
						className: WorktreePanel_module_css_default.icon
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("worktreeMode") })]
				})]
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
//#region src/client/worktreeStore.ts
function createWorktreeStore() {
	let byId = /* @__PURE__ */ new Map();
	let version = 0;
	const listeners = /* @__PURE__ */ new Set();
	const bump = (next) => {
		byId = next;
		version += 1;
		for (const listener of listeners) listener();
	};
	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getVersion() {
			return version;
		},
		stateOf(sessionId) {
			if (sessionId === void 0) return {
				name: void 0,
				worktree: false
			};
			return byId.get(sessionId) ?? {
				name: void 0,
				worktree: false
			};
		},
		declare(sessionId, name$1) {
			if (sessionId === void 0) return;
			const current = byId.get(sessionId);
			const next = {
				name: name$1 ?? void 0,
				worktree: true
			};
			if (current !== void 0 && current.name === next.name && current.worktree === next.worktree) return;
			const cloned = new Map(byId);
			cloned.set(sessionId, next);
			bump(cloned);
		},
		clear(sessionId) {
			if (sessionId === void 0) return;
			if (!byId.has(sessionId)) return;
			const cloned = new Map(byId);
			cloned.delete(sessionId);
			bump(cloned);
		}
	};
}

//#endregion
//#region src/client/index.ts
/**
* dsh-task-worktree browser half.
*
* Mounts a compact worktree action bar into `conversation.input.dock`, a
* worktree recognition badge into `conversation.session.header.actions`, and
* a "start in worktree mode" strip on blank conversations.
*
* Workspace discipline: creating a worktree NEVER registers a workspace and
* NEVER switches the conversation — work continues in-place.
*
* Data channels: the strip's blank-hero detection reads the host session
* list (`blank` flag and cwd — window-independent); the badge reads the
* worktree declaration store (set by start-in-worktree-mode) plus the session
* cwd. Note: framework session standard props (useSession / useInput) are NOT
* injected into slot components in the current shell, so nothing depends on
* them.
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
	/** Reactive store for worktree-mode declarations. */
	const store = createWorktreeStore();
	/** Resolve the current session face through the current selection id. */
	const currentSession = () => {
		const current = ctx.sessions.list.getSnapshot().current;
		if (current === void 0) return void 0;
		return ctx.sessions.binding(current)?.session;
	};
	/** Resolve the current selection id (the staged conversation). */
	const currentSessionId = () => ctx.sessions.list.getSnapshot().current;
	/** Resolve the current cwd from the list summary (the outward session face intentionally omits it). */
	const currentCwd = () => {
		const snapshot = ctx.sessions.list.getSnapshot();
		return snapshot.current !== void 0 ? snapshot.byId[snapshot.current]?.cwd : void 0;
	};
	/** Whether the staged session is still blank (host-computed empty-log bit). */
	const currentBlank = () => {
		const snapshot = ctx.sessions.list.getSnapshot();
		return snapshot.current !== void 0 && snapshot.byId[snapshot.current]?.blank === true;
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
	* Arm this conversation for worktree mode: the host injects the creation
	* instruction with the NEXT genuine user message (no separate prompt, no
	* workspace registration). Name from the caller when given, otherwise the
	* model proposes one. On success the session is declared worktree-mode in
	* the store (the badge switches on immediately).
	*/
	const armWorktreeMode = async (rawName) => {
		const sessionId = currentSessionId();
		const session = currentSession();
		if (session === void 0 || sessionId === void 0) throw new Error("当前没有可注入的对话");
		const trimmed = rawName?.trim() ?? "";
		const name$1 = trimmed === "" ? void 0 : trimmed.startsWith("worktree/") ? trimmed : `worktree/${trimmed}`;
		const line = name$1 !== void 0 ? `/worktree mode-on ${name$1}` : "/worktree mode-on";
		const result = await session.command(line);
		if (!result.ok || result.value.matched !== true) throw new Error("指令未执行成功");
		store.declare(sessionId, name$1);
	};
	/** Disarm worktree mode for the current conversation. */
	const disarmWorktreeMode = async () => {
		const sessionId = currentSessionId();
		const session = currentSession();
		if (session === void 0 || sessionId === void 0) throw new Error("当前没有可注入的对话");
		const result = await session.command("/worktree mode-off");
		if (!result.ok || result.value.matched !== true) throw new Error("指令未执行成功");
		store.clear(sessionId);
	};
	ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
		name: "conversation.input.dock",
		id: "worktree",
		order: 10,
		locale: NS
	}, () => (0, react.createElement)(WorktreePanel, {
		currentSession,
		currentCwd,
		currentBlank,
		openLocalWorkspace,
		armWorktreeMode,
		disarmWorktreeMode,
		store,
		sessionIdOf: currentSessionId,
		t
	})));
	ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
		name: "conversation.session.header.actions",
		id: "worktree-badge",
		order: -30,
		locale: NS
	}, () => (0, react.createElement)(WorktreeBadge, {
		store,
		sessionIdOf: currentSessionId,
		currentCwd,
		t
	})));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;
return module.exports; } });
//# sourceMappingURL=client.js.map