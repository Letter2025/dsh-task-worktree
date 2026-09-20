/**
 * Locale dictionaries for the dsh-task-worktree client half.
 * Product copy is Chinese; the English side exists for parity.
 */

export const zh = {
  panelTitle: '工作树',
  localMode: '本地模式',
  worktreeMode: 'Worktree模式',
  switching: '正在切换…',
  fail: '命令未执行成功',
  badgeTooltip: '本对话使用的 worktree',
  badgeFallback: 'worktree',
  heroStartLabel: '分支名：',
  heroStartPlaceholder: '可选，留空由 AI 命名',
  settingsCardTitle: '任务 Worktree',
  settingsCardDesc: '新对话默认进入的执行环境',
  settingsDefaultMode: '新对话默认模式',
  settingsDefaultLocalHint: '空白对话直接在主工作区开始。',
  settingsDefaultWorktreeHint: '空白对话以 worktree 模式开始：发出第一条消息时自动创建隔离的 worktree，无需再手动选择。',
  settingsRemember: '记住上次选择',
  settingsRememberHint: '空白对话沿用你在输入框上方最后选定的模式。',
  settingsRememberedNow: '当前记住：',
  settingsUnavailable: '当前宿主没有可写的设置存储，修改不会被保存。',
  settingsSaveFailed: '保存失败',
}

export const en = {
  panelTitle: 'Worktrees',
  localMode: 'Local mode',
  worktreeMode: 'Worktree mode',
  switching: 'Switching…',
  fail: 'Command failed',
  badgeTooltip: 'Worktree used by this conversation',
  badgeFallback: 'worktree',
  heroStartLabel: 'Branch: ',
  heroStartPlaceholder: 'optional; blank: AI proposes',
  settingsCardTitle: 'Task worktree',
  settingsCardDesc: 'The execution environment new conversations start in',
  settingsDefaultMode: 'Default mode for new conversations',
  settingsDefaultLocalHint: 'A blank conversation starts directly in the main workspace.',
  settingsDefaultWorktreeHint: 'A blank conversation starts in worktree mode: the isolated worktree is created automatically with your first message.',
  settingsRemember: 'Remember the last choice',
  settingsRememberHint: 'A blank conversation starts with the mode you picked last above the composer.',
  settingsRememberedNow: 'Currently remembered: ',
  settingsUnavailable: 'This host has no writable settings storage, so changes cannot be saved.',
  settingsSaveFailed: 'Could not save',
}

export type WorktreeKey = typeof zh
