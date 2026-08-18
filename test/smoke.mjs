/**
 * End-to-end smoke test for dsh-task-worktree core (no harness required).
 * Uses the child_process git runner against a scratch repository.
 * Covers: create (branch, base), list, status, carry-uncommitted, direct
 * commit (finish), bring-back merge, remove, prune, and error paths.
 * Run: node test/smoke.mjs
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createProcessRunner } from '../lib/git.js'
import { createWorktreeManager, WorktreeError } from '../lib/manager.js'

let failed = 0
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${label}`)
  } else {
    failed += 1
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

const base = await mkdtemp(path.join(tmpdir(), 'dsh-tw-'))
const repo = path.join(base, 'repo')
const git = createProcessRunner()
async function run(args, cwd) {
  const r = await git(args, cwd)
  if (r.exitCode !== 0) throw new Error(`git ${args[0]} failed: ${r.stderr}`)
  return r.stdout
}
const manager = createWorktreeManager({ git })

try {
  await mkdir(repo, { recursive: true })
  await run(['init', '-b', 'main'], repo)
  await run(['config', 'user.email', 'smoke@test.local'], repo)
  await run(['config', 'user.name', 'smoke'], repo)
  await writeFile(path.join(repo, 'a.txt'), 'hello\n')
  await run(['add', '-A'], repo)
  await run(['commit', '-m', 'initial'], repo)
  const initialHead = await run(['rev-parse', 'HEAD'], repo)

  console.log('create (branch-based)')
  const created = await manager.create({ name: 'feature-auth', cwd: repo, createdBy: 'src-1' })
  check('repoRoot is the repo', path.basename(created.repoRoot) === 'repo')
  check('entry has branch worktree-feature-auth', created.worktree.branch === 'worktree-feature-auth')
  check('entry path under .dsh-worktrees', created.worktree.path.includes(`${path.sep}.dsh-worktrees${path.sep}`))
  check('worktree checkout exists at base', (await run(['rev-parse', 'HEAD'], created.worktree.path)) === initialHead)
  const branchList = await run(['branch', '--list', 'worktree-feature-auth'], repo)
  check('branch created in source repo', branchList.includes('worktree-feature-auth'))
  // create auto-appends .dsh-worktrees/ to .gitignore; commit it so the main
  // workspace is clean again for bring-back checks.
  await run(['add', '.gitignore'], repo)
  await run(['commit', '-m', 'chore: ignore .dsh-worktrees'], repo)

  console.log('list / status')
  let listed = await manager.list(repo)
  check('list shows one entry', listed.worktrees.length === 1 && listed.worktrees[0].name === 'feature-auth')
  check('list entry exists with head', listed.worktrees[0].exists === true && listed.worktrees[0].head === initialHead)
  let st = await manager.status({ name: 'feature-auth', cwd: repo })
  check('status shows branch + clean', st.worktree.branch === 'worktree-feature-auth' && st.worktree.dirty === false)
  let stByCwd = await manager.status({ cwd: created.worktree.path })
  check('status by cwd finds the worktree', stByCwd.worktree.name === 'feature-auth')

  console.log('commit inside worktree, then finish')
  await writeFile(path.join(created.worktree.path, 'b.txt'), 'world\n')
  let stDirty = await manager.status({ name: 'feature-auth', cwd: repo })
  check('worktree dirty after edit', stDirty.worktree.dirty === true)
  let noMsg = false
  try { await manager.finish({ name: 'feature-auth', cwd: repo }) } catch (e) { noMsg = e instanceof WorktreeError && e.code === 'INVALID_INPUT' }
  check('finish rejects missing message', noMsg)
  const finished = await manager.finish({ name: 'feature-auth', message: 'feat: add auth', cwd: repo, sourceSessionId: 'src-1' })
  check('finish committed', finished.committed === true && finished.commitOid)
  const subject = await run(['log', '-1', '--format=%s'], created.worktree.path)
  check('commit subject is the message', subject === 'feat: add auth')

  console.log('bring-back (Move to local)')
  let dirtyMain = false
  await writeFile(path.join(repo, 'a.txt'), 'hello dirty\n')
  try { await manager.bringBack({ name: 'feature-auth', cwd: repo }) } catch (e) { dirtyMain = e instanceof WorktreeError && e.code === 'MAIN_DIRTY' }
  check('bring-back refuses dirty main', dirtyMain)
  await run(['checkout', '--', 'a.txt'], repo)

  // second worktree to merge: no commits on main yet, so merge is a fast-forward
  const created2 = await manager.create({ name: 'feature-ui', cwd: repo, createdBy: 'src-1' })
  await writeFile(path.join(created2.worktree.path, 'c.txt'), 'ui\n')
  const bb = await manager.bringBack({ name: 'feature-ui', cwd: repo })
  check('bring-back returned new main head', Boolean(bb.mainHead))
  const mainFiles = await run(['ls-files'], repo)
  check('main workspace now has c.txt', mainFiles.includes('c.txt'))
  const mergedState = await manager.status({ name: 'feature-ui', cwd: repo })
  check('worktree state becomes brought-back', mergedState.worktree.state === 'brought-back')
  check('worktree checkout still on disk', mergedState.worktree.exists === true)

  console.log('carry uncommitted changes')
  await writeFile(path.join(repo, 'pending.txt'), 'pending\n')
  const carried = await manager.create({ name: 'feature-carry', cwd: repo, includeUncommitted: true, createdBy: 'src-1' })
  const carriedFiles = await run(['ls-files', '--others', '--exclude-standard'], carried.worktree.path)
  const carriedDiff = await run(['status', '--porcelain'], carried.worktree.path)
  check('untracked main file copied into worktree', carriedFiles.includes('pending.txt'))
  check('carried worktree shows the pending file dirty', carriedDiff.includes('?? pending.txt'))
  await run(['checkout', '--', '.'], repo).catch(() => {})
  await run(['clean', '-fd'], repo).catch(() => {})

  console.log('remove + prune')
  await manager.remove({ name: 'feature-auth', cwd: repo, currentDir: repo })
  const removedList = await manager.list(repo)
  check('remove deleted manifest record', !removedList.worktrees.some((w) => w.name === 'feature-auth'))
  // manually delete a worktree directory, then prune the stale record
  const target = removedList.worktrees.find((w) => w.name === 'feature-carry')
  await run(['worktree', 'remove', '--force', target.path], repo)
  await rm(target.path, { recursive: true, force: true })
  const pruned = await manager.prune({ cwd: repo })
  check('prune drops stale record', pruned.pruned.includes('feature-carry'))
  const finalList = await manager.list(repo)
  check('only feature-ui remains', finalList.worktrees.length === 1 && finalList.worktrees[0].name === 'feature-ui')

  console.log('error paths')
  let dup = false
  try { await manager.create({ name: 'feature-ui', cwd: repo }) } catch (e) { dup = e instanceof WorktreeError && e.code === 'ALREADY_EXISTS' }
  check('duplicate create rejected', dup)
  let badName = false
  try { await manager.create({ name: '../evil', cwd: repo }) } catch (e) { badName = e instanceof WorktreeError && e.code === 'INVALID_NAME' }
  check('path-traversal name rejected', badName)
  let inUse = false
  try { await manager.remove({ name: 'feature-ui', cwd: created2.worktree.path, currentDir: created2.worktree.path }) } catch (e) { inUse = e instanceof WorktreeError && e.code === 'IN_USE' }
  check('remove refuses current worktree', inUse)

  console.log(failed === 0 ? '\nSMOKE OK — all checks passed' : `\nSMOKE FAILED — ${failed} check(s) failed`)
} finally {
  await rm(base, { recursive: true, force: true })
}

process.exit(failed === 0 ? 0 : 1)