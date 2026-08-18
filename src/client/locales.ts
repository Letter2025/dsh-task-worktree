/**
 * Locale dictionaries for the dsh-task-worktree client half.
 * Product copy is Chinese; the English side exists for parity.
 */

export const zh = {
  panelTitle: '工作树',
  empty: '暂无受管理的 worktree',
  refresh: '刷新',
  create: '新建',
  bringBack: '带回',
  remove: '删除',
  status: '状态',
  branch: '分支',
  path: '路径',
  dirty: '有未提交改动',
}

export const en = {
  panelTitle: 'Worktrees',
  empty: 'No managed worktrees yet',
  refresh: 'Refresh',
  create: 'New',
  bringBack: 'Bring back',
  remove: 'Remove',
  status: 'Status',
  branch: 'Branch',
  path: 'Path',
  dirty: 'has uncommitted changes',
}

export type WorktreeKey = typeof zh