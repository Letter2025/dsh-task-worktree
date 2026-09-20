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
	heroStartPlaceholder: "可选，留空由 AI 命名",
	settingsCardTitle: "任务 Worktree",
	settingsCardDesc: "新对话默认进入的执行环境",
	settingsDefaultMode: "新对话默认模式",
	settingsDefaultLocalHint: "空白对话直接在主工作区开始。",
	settingsDefaultWorktreeHint: "空白对话以 worktree 模式开始：发出第一条消息时自动创建隔离的 worktree，无需再手动选择。",
	settingsRemember: "记住上次选择",
	settingsRememberHint: "空白对话沿用你在输入框上方最后选定的模式。",
	settingsRememberedNow: "当前记住：",
	settingsUnavailable: "当前宿主没有可写的设置存储，修改不会被保存。",
	settingsSaveFailed: "保存失败"
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
	heroStartPlaceholder: "optional; blank: AI proposes",
	settingsCardTitle: "Task worktree",
	settingsCardDesc: "The execution environment new conversations start in",
	settingsDefaultMode: "Default mode for new conversations",
	settingsDefaultLocalHint: "A blank conversation starts directly in the main workspace.",
	settingsDefaultWorktreeHint: "A blank conversation starts in worktree mode: the isolated worktree is created automatically with your first message.",
	settingsRemember: "Remember the last choice",
	settingsRememberHint: "A blank conversation starts with the mode you picked last above the composer.",
	settingsRememberedNow: "Currently remembered: ",
	settingsUnavailable: "This host has no writable settings storage, so changes cannot be saved.",
	settingsSaveFailed: "Could not save"
};

//#endregion
//#region src/client/worktreeLedger.ts
/**
* Client-side worktree recognition helpers.
*
* The plugin no longer registers a workspace per worktree (that cluttered the
* sidebar); each conversation is *labelled* instead. The label comes from the
* worktree declaration store (armed via start-in-worktree-mode) or from the
* session cwd when it runs inside a managed checkout.
*
* dsh 0.1.2 note: the transcript-scanning helper (`worktreeNameOfSnapshot`)
* was removed — `@deepseek-ai/dsh-client-runtime` and its ConversationNode
* model no longer exist; the badge derives the label from the store plus cwd.
*/
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
const css$1 = ".Y0CJ8q_root{z-index:8;box-sizing:border-box;width:min(var(--dsh-composer-card-max-width,780px), calc(100% - 32px));min-height:28px;color:var(--dsw-alias-label-primary,#1f1f1f);pointer-events:none;align-self:center;align-items:center;padding-left:8px;font-size:13px;display:flex;position:relative}.Y0CJ8q_trigger{min-height:28px;color:inherit;font:inherit;white-space:nowrap;cursor:pointer;pointer-events:auto;background:0 0;border:0;border-radius:6px;align-items:center;gap:5px;padding:4px 7px;font-weight:500;line-height:18px;display:inline-flex}.Y0CJ8q_trigger:hover,.Y0CJ8q_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_menuItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_backButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_secondaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_primaryButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_nameInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f73ff);outline-offset:1px}.Y0CJ8q_icon{color:var(--dsw-alias-label-secondary,#5f6368);flex:none}.Y0CJ8q_chevron{color:var(--dsw-alias-label-caption,#8a8f98);flex:none;transition:transform .14s}.Y0CJ8q_chevronOpen{transform:rotate(180deg)}.Y0CJ8q_popover{z-index:60;width:168px;color:var(--dsw-alias-label-primary,#1f1f1f);background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,#0000001f);pointer-events:auto;border-radius:7px;padding:4px;position:absolute;top:calc(100% + 6px);left:8px;overflow:hidden;box-shadow:0 10px 28px #00000021,0 2px 8px #00000014}.Y0CJ8q_menuItem{width:100%;min-height:32px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:5px;grid-template-columns:16px minmax(0,1fr) 14px;align-items:center;gap:7px;padding:6px 8px;font-weight:400;line-height:18px;display:grid}.Y0CJ8q_menuItem>span{text-overflow:ellipsis;white-space:nowrap;grid-column:2;overflow:hidden}.Y0CJ8q_menuItem:hover,.Y0CJ8q_menuItem.Y0CJ8q_selected{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_menuItem:disabled{cursor:default;opacity:.5}.Y0CJ8q_menuItem.Y0CJ8q_danger{color:var(--dsw-alias-state-error,#c93b3b)}.Y0CJ8q_menuItem.Y0CJ8q_danger .Y0CJ8q_icon{color:currentColor}.Y0CJ8q_trailingIcon{color:var(--dsw-alias-label-caption,#8a8f98);grid-column:3;justify-self:end}.Y0CJ8q_separator{background:var(--dsw-alias-border-l2,#0000001a);height:1px;margin:4px 6px}.Y0CJ8q_menuHeader{border-bottom:1px solid var(--dsw-alias-border-l2,#0000001a);align-items:center;gap:5px;min-height:32px;margin-bottom:4px;padding:4px 6px 5px 4px;font-weight:600;display:flex}.Y0CJ8q_backButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary,#5f6368);cursor:pointer;background:0 0;border:0;border-radius:5px;flex:none;place-items:center;padding:0;display:inline-grid}.Y0CJ8q_backButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_createPanel{width:272px}.Y0CJ8q_popover:has(.Y0CJ8q_createPanel){width:280px}.Y0CJ8q_nameInput{box-sizing:border-box;width:calc(100% - 12px);height:34px;color:inherit;font:inherit;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l1,#0003);border-radius:6px;margin:7px 6px 9px;padding:6px 9px}.Y0CJ8q_nameInput::placeholder{color:var(--dsw-alias-label-caption,#8a8f98)}.Y0CJ8q_createActions{justify-content:flex-end;gap:6px;padding:0 6px 5px;display:flex}.Y0CJ8q_secondaryButton,.Y0CJ8q_primaryButton{min-height:28px;font:inherit;cursor:pointer;border-radius:6px;padding:4px 11px}.Y0CJ8q_secondaryButton{color:inherit;border:1px solid var(--dsw-alias-border-l2,#0000001f);background:0 0}.Y0CJ8q_secondaryButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_primaryButton{color:#fff;background:var(--dsw-alias-state-business-primary,#4f73ff);border:1px solid #0000}.Y0CJ8q_primaryButton:disabled{cursor:default;opacity:.45}.Y0CJ8q_notice{color:var(--dsw-alias-state-error,#c93b3b);white-space:nowrap;pointer-events:auto;margin-left:6px;font-size:12px}.Y0CJ8q_badge{max-width:200px;min-height:20px;color:var(--dsw-alias-label-secondary,#5f6368);white-space:nowrap;border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:999px;align-items:center;gap:4px;padding:1px 7px;font-size:11px;line-height:16px;display:inline-flex;overflow:hidden}.Y0CJ8q_badge>span{text-overflow:ellipsis;overflow:hidden}.Y0CJ8q_badgeIcon{color:var(--dsw-alias-state-business-primary,#4f73ff);flex:none}.Y0CJ8q_heroStart{border:1px dashed var(--dsw-alias-border-l2,#00000029);pointer-events:auto;border-radius:7px;align-items:center;gap:6px;min-height:28px;margin-left:6px;padding:2px 6px 2px 4px;display:inline-flex}.Y0CJ8q_heroStartLabel{white-space:nowrap;font-weight:500}.Y0CJ8q_heroStartInput{box-sizing:border-box;width:230px;height:26px;color:inherit;font:inherit;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l1,#0003);border-radius:6px;padding:3px 8px}.Y0CJ8q_heroStartInput::placeholder{color:var(--dsw-alias-label-caption,#8a8f98)}.Y0CJ8q_heroStartButton{color:#fff;min-height:26px;font:inherit;cursor:pointer;background:var(--dsw-alias-state-business-primary,#4f73ff);border:1px solid #0000;border-radius:6px;padding:3px 12px;font-weight:500}.Y0CJ8q_heroStartButton:disabled{cursor:default;opacity:.45}.Y0CJ8q_armedCancel{min-height:26px;color:inherit;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#0000001f);background:0 0;border-radius:6px;padding:3px 12px}.Y0CJ8q_armedCancel:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000e)}.Y0CJ8q_armedCancel:disabled{cursor:default;opacity:.45}.Y0CJ8q_commandRow{color:var(--dsw-alias-label-primary,#1f1f1f);flex-direction:column;gap:2px;padding:4px 0;font-size:12px;line-height:17px;display:flex}.Y0CJ8q_commandRowLine{word-break:break-all;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:600}.Y0CJ8q_commandRowOutcome{color:var(--dsw-alias-label-secondary,#5f6368);white-space:pre-wrap;word-break:break-word}.Y0CJ8q_commandRowError{color:var(--dsw-alias-state-error,#c93b3b)}[data-phase=hero] .Y0CJ8q_root{flex:none;align-self:flex-start;width:auto;max-width:calc(100% - 32px);padding-left:20px;display:inline-flex}[data-phase=hero] .Y0CJ8q_popover{left:20px}@media (max-width:720px){.Y0CJ8q_root{width:calc(100% - 20px);padding-left:0}.Y0CJ8q_popover{left:0}}";
const tagId$1 = "dsh-task-worktree/WorktreePanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-task-worktree";
	tag.dataset.pluginCss = tagId$1;
	tag.textContent = css$1;
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
*
* On a blank conversation the selector reflects the configured default mode
* (`task-worktree` settings namespace): with the default set to worktree the
* strip is pre-armed and the host injects the creation instruction with the
* first message. Picking a mode is always an explicit answer for THIS
* conversation, and — when "remember the last choice" is on — it also updates
* the default.
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
	const prefs = (0, react.useSyncExternalStore)(props.prefs.subscribe, props.prefs.getSnapshot);
	const sessionId = sessionIdOf();
	const declared = store.stateOf(sessionId);
	const hero = props.currentBlank();
	const defaultWorktree = hero && !declared.explicit && prefs.defaultMode === "worktree";
	const preArmed = defaultWorktree && !declared.worktree;
	const mode = declared.worktree || defaultWorktree || currentMode(props) === "worktree" ? "worktree" : "local";
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
		declaredWorktree: declared.worktree,
		defaultMode: prefs.defaultMode,
		explicit: declared.explicit
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
	/** Persist a mode the user picked as the default for future conversations. */
	const remember = (choice) => {
		if (prefs.rememberLastChoice) props.prefs.setDefaultMode(choice);
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
		if (declared.worktree || preArmed) {
			remember("local");
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
			(declared.worktree || preArmed) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
						remember("worktree");
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
const UNDECIDED = {
	name: void 0,
	worktree: false,
	explicit: false
};
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
			if (sessionId === void 0) return UNDECIDED;
			return byId.get(sessionId) ?? UNDECIDED;
		},
		declare(sessionId, name$1) {
			if (sessionId === void 0) return;
			const current = byId.get(sessionId);
			const next = {
				name: name$1 ?? void 0,
				worktree: true,
				explicit: true
			};
			if (current !== void 0 && current.name === next.name && current.worktree && current.explicit) return;
			const cloned = new Map(byId);
			cloned.set(sessionId, next);
			bump(cloned);
		},
		clear(sessionId) {
			if (sessionId === void 0) return;
			const current = byId.get(sessionId);
			if (current !== void 0 && !current.worktree && current.explicit) return;
			const cloned = new Map(byId);
			cloned.set(sessionId, {
				name: void 0,
				worktree: false,
				explicit: true
			});
			bump(cloned);
		}
	};
}

//#endregion
//#region src/client/worktreePrefs.ts
/**
* Durable preferences of dsh-task-worktree, read and written through the
* client settings scope (`ctx.settingsScope`, provided by
* `@deepseek-ai/dsh-client-ui-settings`).
*
* The host half registers the `task-worktree` settings namespace; this store is
* the browser mirror of it. It keeps a plain observable snapshot so slot
* components can read it through `useSyncExternalStore`, and it routes every
* user choice through the scope's revision-fenced writes.
*
* The settings transport is reached structurally rather than by importing its
* types: this external package must stay free of monorepo-internal type
* dependencies, and a host without the service simply never binds (the store
* then reports `available: false` and the controls render disabled).
*/
/** Settings namespace owned by the host half; keep in sync with `lib/index.js`. */
const SETTINGS_NS = "task-worktree";
/** Read the three-way panel choice out of a resolved section. */
function choiceOf(prefs) {
	return prefs.rememberLastChoice ? "last" : prefs.defaultMode;
}
/** Snapshot used before any settings service answers (the schema defaults). */
const PREFS_FALLBACK = Object.freeze({
	defaultMode: "local",
	rememberLastChoice: false,
	status: "loading",
	available: false
});
/**
* Narrow one wire section to the section this plugin owns.
*
* The host resolves the schema before the value reaches the browser, so this
* stays defensive rather than validating: an unexpected section keeps the last
* accepted value (returning undefined). Both fields fall back to the schema
* default (local, no remembering) rather than to a truthy guess.
*/
function decode(section) {
	if (typeof section !== "object" || section === null || Array.isArray(section)) return void 0;
	const raw = section;
	return {
		defaultMode: raw.defaultMode === "worktree" ? "worktree" : "local",
		rememberLastChoice: raw.rememberLastChoice === true
	};
}
function createPrefsStore() {
	let snapshot = PREFS_FALLBACK;
	let scope;
	const listeners = /* @__PURE__ */ new Set();
	const publish = (next) => {
		if (snapshot.defaultMode === next.defaultMode && snapshot.rememberLastChoice === next.rememberLastChoice && snapshot.status === next.status && snapshot.available === next.available) return;
		snapshot = next;
		for (const listener of listeners) listener();
	};
	/** Fold the scope's latest accepted section into the local snapshot. */
	const adopt = () => {
		if (scope === void 0) return;
		const current = scope.getSnapshot();
		const value = current.value;
		publish({
			defaultMode: value?.defaultMode === "worktree" ? "worktree" : "local",
			rememberLastChoice: value?.rememberLastChoice !== false,
			status: current.status,
			available: current.status === "ready" && current.writable
		});
	};
	/**
	* Apply ordered writes and confirm acceptance by re-reading the scope.
	*
	* The transport RESOLVES even when the host refuses a write, so the resolved
	* promise proves nothing; the documented way to detect refusal is to read the
	* section back (a rejected write triggers the scope's recovery read first).
	* A host without `mutate` falls back to per-field `set`, which is the same
	* sequence without the atomicity fence.
	*/
	const apply$1 = async (ops) => {
		if (scope === void 0) return false;
		try {
			if (typeof scope.mutate === "function") await scope.mutate(ops);
			else for (const op of ops) if (op.op === "set") await scope.set(op.path[0], op.value);
		} catch (error) {
			console.warn(`[dsh-task-worktree] settings write failed: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
		const current = scope.getSnapshot();
		const section = current.value;
		if (current.status !== "ready" || section === void 0) return false;
		const accepted = ops.every((op) => op.op !== "set" || section[op.path[0]] === op.value);
		adopt();
		return accepted;
	};
	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getSnapshot() {
			return snapshot;
		},
		bind(binder) {
			scope = binder.bind({
				namespace: SETTINGS_NS,
				decode
			});
			adopt();
			return scope.subscribe(adopt);
		},
		setDefaultMode(mode) {
			return apply$1([{
				op: "set",
				path: ["defaultMode"],
				value: mode
			}]);
		},
		setNewConversationChoice(choice) {
			if (choice === "last") return apply$1([{
				op: "set",
				path: ["rememberLastChoice"],
				value: true
			}]);
			return apply$1([{
				op: "set",
				path: ["defaultMode"],
				value: choice
			}, {
				op: "set",
				path: ["rememberLastChoice"],
				value: false
			}]);
		}
	};
}

//#endregion
//#region \0dsh-css:src/client/WorktreeSettings.module.css.mjs
const css = ".sqfP6G_card{border:.5px solid var(--dsw-alias-border-l4,#ffffff24);background:var(--dsw-alias-bg-layer-3,#26262b);border-radius:16px;list-style:none;transition:border-color .16s,background .16s}.sqfP6G_card:hover{border-color:var(--dsw-alias-label-dimmed,#ffffff57)}.sqfP6G_cardOpen{background:var(--dsw-alias-bg-layer-2,#1f1f24);border-color:var(--dsw-alias-label-dimmed,#ffffff57)}.sqfP6G_header{width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;-webkit-appearance:none;appearance:none;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.sqfP6G_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4f73ff);outline-offset:-2px}.sqfP6G_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.sqfP6G_name{color:var(--dsw-alias-label-primary,#fff);font-size:15px;font-weight:600;line-height:1.4}.sqfP6G_description{color:var(--dsw-alias-label-tertiary,#8a8f98);font-size:13px;line-height:1.5}.sqfP6G_chevron{color:var(--dsw-alias-label-tertiary,#8a8f98);flex:none;transition:transform .16s}.sqfP6G_chevronOpen{transform:rotate(180deg)}.sqfP6G_body{border-top:.5px solid var(--dsw-alias-border-l2,#ffffff14);margin:0 16px;padding-bottom:8px}.sqfP6G_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.sqfP6G_head{align-items:center;gap:8px;display:flex}.sqfP6G_label{min-width:0;color:var(--dsw-alias-label-primary,#fff);flex:1;font-size:13px;font-weight:500;line-height:1.5}.sqfP6G_controlIcon{flex:none}.sqfP6G_hint{color:var(--dsw-alias-label-tertiary,#8a8f98);margin:0;font-size:12px;line-height:1.5}.sqfP6G_readOnly,.sqfP6G_failed{margin:12px 0 0;font-size:12px;line-height:1.5}.sqfP6G_readOnly{color:var(--dsw-alias-label-tertiary,#8a8f98)}.sqfP6G_failed{color:var(--dsw-alias-label-error,#e06c6c)}";
const tagId = "dsh-task-worktree/WorktreeSettings.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-task-worktree";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorktreeSettings_module_css_default = {
	"body": "sqfP6G_body",
	"card": "sqfP6G_card",
	"cardOpen": "sqfP6G_cardOpen",
	"chevron": "sqfP6G_chevron",
	"chevronOpen": "sqfP6G_chevronOpen",
	"controlIcon": "sqfP6G_controlIcon",
	"description": "sqfP6G_description",
	"failed": "sqfP6G_failed",
	"field": "sqfP6G_field",
	"head": "sqfP6G_head",
	"headText": "sqfP6G_headText",
	"header": "sqfP6G_header",
	"hint": "sqfP6G_hint",
	"label": "sqfP6G_label",
	"name": "sqfP6G_name",
	"readOnly": "sqfP6G_readOnly"
};

//#endregion
//#region src/client/WorktreeSettingsCard.tsx
/**
* The plugin's card on the Plugins → Plugin configuration settings page.
*
* It owns the `task-worktree` settings namespace through ONE three-way choice:
* pin local mode, pin worktree mode, or let the composer's picker decide and
* remember it. Two controls (a mode plus a "remember" switch) would describe
* the same three states with a fourth combination that means nothing, which is
* why this is a single choice.
*
* Everything interactive is a host primitive: the trigger is the host `Button`
* and the list is the host `Menu` — the same pair the Permission row uses for
* its own "choose one" setting. What this module styles is only the card chrome
* and the field typography, which the host does not export for plugin-owned
* cards (`ui-settings-plugins` exports `apply`/`inject` and types only).
*
* Writes go through the client settings scope (revision-fenced, persisted by
* the host), so the value is live and survives restarts. The card is dispatched
* by the Plugins section under the settings namespace this plugin's host half
* registers, so it appears only where that namespace is actually served.
*/
function WorktreeSettingsCard({ prefs, t }) {
	const snapshot = (0, react.useSyncExternalStore)(prefs.subscribe, prefs.getSnapshot);
	const [open, setOpen] = (0, react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, react.useState)(false);
	const [busy, setBusy] = (0, react.useState)(false);
	const [failed, setFailed] = (0, react.useState)(false);
	const disabled = !snapshot.available || busy;
	const choice = choiceOf(snapshot);
	const remembered = snapshot.defaultMode === "worktree" ? t("worktreeMode") : t("localMode");
	const hint = choice === "last" ? `${t("settingsRememberHint")} ${t("settingsRememberedNow")}${remembered}` : choice === "worktree" ? t("settingsDefaultWorktreeHint") : t("settingsDefaultLocalHint");
	const options = [
		{
			id: "local",
			label: t("localMode")
		},
		{
			id: "worktree",
			label: t("worktreeMode")
		},
		{
			id: "last",
			label: t("settingsRemember")
		}
	];
	const selected = options.find((option) => option.id === choice) ?? options[0];
	const choose = (next) => {
		setMenuOpen(false);
		if (disabled || next === choice) return;
		setBusy(true);
		setFailed(false);
		prefs.setNewConversationChoice(next).then((ok) => {
			if (!ok) setFailed(true);
		}).finally(() => {
			setBusy(false);
		});
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: open ? `${WorktreeSettings_module_css_default.card} ${WorktreeSettings_module_css_default.cardOpen}` : WorktreeSettings_module_css_default.card,
		"data-testid": "worktree-settings-card",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: WorktreeSettings_module_css_default.header,
			"aria-expanded": open,
			onClick: () => {
				setOpen(!open);
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorktreeSettings_module_css_default.headText,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorktreeSettings_module_css_default.name,
					children: t("settingsCardTitle")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorktreeSettings_module_css_default.description,
					children: t("settingsCardDesc")
				})]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: open ? `${WorktreeSettings_module_css_default.chevron} ${WorktreeSettings_module_css_default.chevronOpen}` : WorktreeSettings_module_css_default.chevron,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 })
			})]
		}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: WorktreeSettings_module_css_default.body,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: WorktreeSettings_module_css_default.field,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorktreeSettings_module_css_default.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: WorktreeSettings_module_css_default.label,
							children: t("settingsDefaultMode")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.Menu, {
							open: menuOpen,
							onClose: () => {
								setMenuOpen(false);
							},
							items: options,
							selectedId: choice,
							onSelect: choose,
							align: "end",
							portal: true,
							anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(__deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "toolbar",
								"aria-haspopup": "menu",
								"aria-expanded": menuOpen,
								disabled,
								onClick: () => {
									setMenuOpen((value) => !value);
								},
								children: [selected.label, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {
									size: 14,
									className: WorktreeSettings_module_css_default.controlIcon
								})]
							})
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: WorktreeSettings_module_css_default.hint,
						children: hint
					})]
				}),
				snapshot.status === "unavailable" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: WorktreeSettings_module_css_default.readOnly,
					children: t("settingsUnavailable")
				}),
				failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: WorktreeSettings_module_css_default.failed,
					role: "alert",
					children: t("settingsSaveFailed")
				})
			]
		})]
	});
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
	/** Durable preferences: default mode for new conversations + last-choice memory. */
	const prefs = createPrefsStore();
	ctx.inject(["settingsScope"], (scoped) => {
		scoped.effect(() => prefs.bind(scoped.settingsScope), `${NS}: settings scope`);
		scoped.slots.inject("settings.plugin.item", () => scoped.slots.register({
			name: "settings.plugin.item",
			key: SETTINGS_NS,
			locale: NS
		}, () => (0, react.createElement)(WorktreeSettingsCard, {
			prefs,
			t
		})));
	});
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
		const sessionId = await ctx.sessions.create({ workspaceId: workspace.workspaceId });
		ctx.sessions.open(sessionId);
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
		prefs,
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