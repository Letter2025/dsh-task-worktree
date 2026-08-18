/**
 * Locale dictionaries for the dsh-task-worktree client half.
 * Product copy is Chinese; the English side exists for parity.
 */

export const zh = {
  panelTitle: '工作树',
  empty: '暂无受管理的 worktree',
  create: '新建',
  list: '列表',
  status: '状态',
  bringBack: '带回',
  remove: '删除',
  prune: '清理',
  confirm: '创建',
  cancel: '取消',
  createPlaceholder: 'worktree 名字（可含 / 分层）',
  fail: '命令未执行成功',
  branch: '分支',
  path: '路径',
  dirty: '有未提交改动',
}

export const en = {
  panelTitle: 'Worktrees',
  empty: 'No managed worktrees yet',
  create: 'New',
  list: 'List',
  status: 'Status',
  bringBack: 'Bring back',
  remove: 'Remove',
  prune: 'Prune',
  confirm: 'Create',
  cancel: 'Cancel',
  createPlaceholder: 'worktree name (slashes allowed)',
  fail: 'Command failed',
  branch: 'Branch',
  path: 'Path',
  dirty: 'has uncommitted changes',
}

export type WorktreeKey = typeof zh