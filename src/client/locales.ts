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
}

export type WorktreeKey = typeof zh