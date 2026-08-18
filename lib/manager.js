/**
 * WorktreeManager: complete worktree lifecycle over one GitRunner.
 *
 * Modeled on the mainstream feature sets:
 * - Codex: permanent worktrees (survive sessions/restarts), per-repo manifest,
 *   `git worktree add` checkouts that stay within the repository.
 * - Claude Code: `worktree-<name>` branch naming, durable session ownership.
 * - Qoder: bring-back (Move to local) and direct-commit收尾, plus carrying
 *   uncommitted main-workspace changes into a new worktree.
 *
 * Everything here is framework-light: it only needs a GitRunner, so the whole
 * manager is testable without a DSH boot.
 *
 * @module dsh-task-worktree/manager
 */
import fs from 'node:fs'
import path from 'node:path'

/** Stable, user-facing failure of worktree management. */
export class WorktreeError extends Error {
  constructor(code, message, options) {
    super(message, options)
    this.name = 'WorktreeError'
    this.code = code
  }
}

const MANIFEST_VERSION = 1
/** Worktree names are one path segment: no spaces, no leading '-'/'.'. */
const WORKTREE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u
const MAX_NAME_LENGTH = 100
const BRANCH_PREFIX = 'worktree-'

function canonical(p) {
  try {
    return fs.realpathSync(p)
  } catch {
    return path.resolve(p)
  }
}

function isWithin(base, candidate) {
  const root = canonical(base)
  const target = canonical(candidate)
  return target === root || target.startsWith(root + path.sep)
}

async function exists(p) {
  try {
    await fs.promises.stat(p)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

/**
 * Manager for one context's permanent worktrees.
 * @param {object} deps
 * @param {Function} deps.git - GitRunner `(args, cwd, signal?) => {exitCode, stdout, stderr}`.
 * @param {string} [deps.dirName] - directory inside each repo root holding worktrees + manifest (default `.dsh-worktrees`).
 */
export function createWorktreeManager({ git, dirName = '.dsh-worktrees' }) {
  const manifestPath = (root) => path.join(root, dirName, 'manifest.json')

  async function loadManifest(root) {
    const file = manifestPath(root)
    try {
      const raw = await fs.promises.readFile(file, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed?.version !== MANIFEST_VERSION || !Array.isArray(parsed.worktrees)) {
        throw new Error('unsupported manifest shape')
      }
      return parsed
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw new WorktreeError('MANIFEST_CORRUPT', `worktree manifest ${file} is unreadable: ${error.message}`, { cause: error })
    }
  }

  async function saveManifest(root, manifest) {
    const dir = path.join(root, dirName)
    await fs.promises.mkdir(dir, { recursive: true })
    const file = path.join(dir, 'manifest.json')
    const tmp = `${file}.tmp-${process.pid}`
    await fs.promises.writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    await fs.promises.rename(tmp, file)
  }

  async function run(args, cwd, signal) {
    const result = await git(args, cwd, signal)
    if (result.exitCode !== 0) {
      throw new WorktreeError('GIT_FAILED', `git ${args[0] ?? ''} failed: ${result.stderr || result.stdout}`)
    }
    return result
  }

  /**
   * Main repo root owning a working directory. Works from the main checkout
   * and from inside a linked worktree.
   */
  async function resolveRepoRoot(cwd, signal) {
    const result = await git(['rev-parse', '--path-format=absolute', '--git-common-dir'], cwd, signal)
    if (result.exitCode !== 0) {
      throw new WorktreeError('NOT_A_GIT_REPO', `${result.stderr || 'not a git repository'} (${cwd})`)
    }
    return canonical(path.resolve(path.dirname(result.stdout)))
  }

  async function resolveCommit(root, baseCommit, signal) {
    const ref = baseCommit?.trim() || 'HEAD'
    const result = await git(['rev-parse', '--verify', `${ref}^{commit}`], root, signal)
    if (result.exitCode !== 0) {
      throw new WorktreeError('BAD_COMMIT', `cannot resolve commit ${JSON.stringify(ref)}: ${result.stderr || 'unknown revision'}`)
    }
    return result.stdout
  }

  async function liveWorktrees(root, signal) {
    const result = await git(['worktree', 'list', '--porcelain'], root, signal)
    const map = new Map()
    if (result.exitCode !== 0) return map
    let current = null
    for (const line of result.stdout.split('\n')) {
      if (line.startsWith('worktree ')) {
        current = { path: canonical(line.slice('worktree '.length)), head: null, branch: null }
        map.set(current.path, current)
      } else if (current && line.startsWith('HEAD ')) {
        current.head = line.slice('HEAD '.length)
      } else if (current && line.startsWith('branch ')) {
        current.branch = line.slice('branch '.length).replace(/^refs\/heads\//u, '')
      }
    }
    return map
  }

  /** Ensure the repo's .gitignore excludes the managed-worktree directory. */
  async function ensureIgnored(root) {
    const ignoreFile = path.join(root, '.gitignore')
    const rule = `${dirName}/\n`
    try {
      const existing = await fs.promises.readFile(ignoreFile, 'utf8')
      if (existing.split('\n').some((line) => line.trim() === `${dirName}/`)) return
      await fs.promises.appendFile(ignoreFile, rule)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.promises.writeFile(ignoreFile, rule)
        return
      }
      throw error
    }
  }

  /** Whether the repo at `cwd` has a clean working tree. */
  async function isClean(cwd, signal) {
    const result = await git(['status', '--porcelain'], cwd, signal)
    return result.exitCode === 0 && result.stdout.length === 0
  }

  /** Copy uncommitted main-workspace changes (tracked diff + untracked files) into a fresh worktree. */
  async function carryUncommitted(root, worktreePath, signal) {
    const diff = await git(['diff', '--binary', 'HEAD'], root, signal)
    if (diff.exitCode === 0 && diff.stdout.length > 0) {
      const applied = await git(['apply', '--whitespace=nowarn'], worktreePath, signal)
      if (applied.exitCode !== 0) {
        throw new WorktreeError('CARRY_FAILED', `cannot apply uncommitted main-workspace changes into ${path.basename(worktreePath)}: ${applied.stderr}`)
      }
    }
    const untracked = await git(['ls-files', '--others', '--exclude-standard'], root, signal)
    for (const rel of untracked.stdout.split('\n').filter(Boolean)) {
      const src = path.join(root, rel)
      const dst = path.join(worktreePath, rel)
      try {
        await fs.promises.mkdir(path.dirname(dst), { recursive: true })
        await fs.promises.copyFile(src, dst)
      } catch (error) {
        throw new WorktreeError('CARRY_FAILED', `cannot copy untracked file ${rel} into worktree: ${error.message}`)
      }
    }
  }

  /** Commit all changes in a worktree onto its branch; no-op when clean. */
  async function ensureCommitted(entry, message, signal) {
    const status = await git(['status', '--porcelain'], entry.path, signal)
    if (status.exitCode !== 0 || status.stdout.length === 0) return false
    await run(['add', '-A'], entry.path, signal)
    await run(['commit', '-m', message], entry.path, signal)
    return true
  }

  return {
    dirName,

    /**
     * Create a permanent task worktree on a new `worktree-<name>` branch.
     * @param {object} params
     * @param {string} params.name - unique worktree name.
     * @param {string} [params.baseCommit] - commit-ish; default current HEAD.
     * @param {boolean} [params.includeUncommitted] - carry main-workspace changes in.
     * @param {string} params.cwd - session working directory.
     * @param {string|null} [params.createdBy] - owning session id or null.
     * @param {AbortSignal} [signal]
     */
    async create({ name, baseCommit, includeUncommitted = false, cwd, createdBy = null, signal }) {
      const trimmed = name.trim()
      if (!WORKTREE_NAME.test(trimmed) || trimmed === '.' || trimmed === '..') {
        throw new WorktreeError('INVALID_NAME', `invalid worktree name ${JSON.stringify(name)}: use letters, digits, '.', '_' or '-', without leading '-' or '.'`)
      }
      if (trimmed.length > MAX_NAME_LENGTH) {
        throw new WorktreeError('INVALID_NAME', `worktree name too long (max ${MAX_NAME_LENGTH} characters)`)
      }
      const root = await resolveRepoRoot(cwd, signal)
      const target = path.join(root, dirName, trimmed)
      if (await exists(target)) {
        throw new WorktreeError('ALREADY_EXISTS', `a directory already exists at ${target}`)
      }
      await ensureIgnored(root)
      const manifest = await loadManifest(root)
      if (manifest?.worktrees.some((entry) => entry.name === trimmed)) {
        throw new WorktreeError('ALREADY_EXISTS', `worktree ${JSON.stringify(trimmed)} already exists in ${root}`)
      }
      const sha = await resolveCommit(root, baseCommit, signal)
      const branch = `${BRANCH_PREFIX}${trimmed}`
      const added = await git(['worktree', 'add', '-b', branch, target, sha], root, signal)
      if (added.exitCode !== 0) {
        throw new WorktreeError('GIT_FAILED', `git worktree add failed: ${added.stderr || added.stdout}`)
      }
      if (includeUncommitted) {
        await carryUncommitted(root, target, signal)
      }
      const entry = {
        name: trimmed,
        path: target,
        branch,
        baseCommit: sha,
        createdAt: new Date().toISOString(),
        createdBy,
        state: 'working',
        permanent: true,
      }
      const next = manifest ?? { version: MANIFEST_VERSION, worktrees: [] }
      next.worktrees.push(entry)
      await saveManifest(root, next)
      return { repoRoot: root, worktree: entry }
    },

    /**
     * List registered worktrees of the repo containing `cwd`, with live git facts.
     * @param {string} cwd
     * @param {AbortSignal} [signal]
     */
    async list(cwd, signal) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      const live = await liveWorktrees(root, signal)
      const worktrees = (manifest?.worktrees ?? []).map((entry) => {
        const state = live.get(canonical(entry.path))
        return { ...entry, exists: state !== undefined, head: state?.head ?? null, branch: state?.branch ?? entry.branch }
      })
      return { repoRoot: root, dir: path.join(root, dirName), worktrees }
    },

    /**
     * Status of one worktree. When `name` is given it must exist; otherwise
     * the worktree containing `cwd` is returned, or null when the session is
     * not inside a managed worktree.
     * @param {object} params - `name?`, `cwd`.
     */
    async status({ name, cwd, signal }) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      const list = manifest?.worktrees ?? []
      let entry = null
      if (name) {
        entry = list.find((candidate) => candidate.name === name.trim()) ?? null
        if (!entry) {
          throw new WorktreeError('NOT_FOUND', `no registered worktree named ${JSON.stringify(name.trim())} in ${root}`)
        }
      } else {
        entry = list.find((candidate) => isWithin(candidate.path, cwd)) ?? null
        if (!entry) return { repoRoot: root, worktree: null }
      }
      const live = await liveWorktrees(root, signal)
      const state = live.get(canonical(entry.path))
      const dirtyResult = await git(['status', '--porcelain'], entry.path, signal)
      return {
        repoRoot: root,
        worktree: {
          ...entry,
          exists: state !== undefined,
          head: state?.head ?? null,
          branch: state?.branch ?? entry.branch,
          dirty: dirtyResult.exitCode === 0 && dirtyResult.stdout.length > 0,
        },
      }
    },

    /**
     * Direct-commit: commit all worktree changes on its branch.
     * @param {object} params - `name`, `message`, `cwd`, optional `sourceSessionId`.
     */
    async finish({ name, message, cwd, sourceSessionId = null, signal }) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      const entry = manifest?.worktrees.find((candidate) => candidate.name === name.trim())
      if (!entry) {
        throw new WorktreeError('NOT_FOUND', `no registered worktree named ${JSON.stringify(name.trim())} in ${root}`)
      }
      if (sourceSessionId && entry.createdBy && entry.createdBy !== sourceSessionId) {
        throw new WorktreeError('NOT_OWNER', `worktree ${JSON.stringify(name.trim())} was created by another session`)
      }
      const msg = message?.trim()
      if (!msg) {
        throw new WorktreeError('INVALID_INPUT', 'a commit message is required: /worktree finish <message>')
      }
      const committed = await ensureCommitted(entry, msg, signal)
      const head = (await git(['rev-parse', 'HEAD'], entry.path, signal)).stdout
      if (committed) {
        entry.state = 'committed'
        entry.committedAt = new Date().toISOString()
        entry.commitOid = head
        await saveManifest(root, manifest)
      }
      return { repoRoot: root, name: entry.name, branch: entry.branch, committed, commitOid: head || null }
    },

    /**
     * Bring-back (Qoder Move to local): require a clean main workspace, commit
     * any worktree changes onto its branch, then merge the branch back into the
     * current main branch. The worktree stays on disk (permanent).
     * @param {object} params - `name`, `cwd`, optional `message`.
     */
    async bringBack({ name, cwd, message = null, signal }) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      const entry = manifest?.worktrees.find((candidate) => candidate.name === name.trim())
      if (!entry) {
        throw new WorktreeError('NOT_FOUND', `no registered worktree named ${JSON.stringify(name.trim())} in ${root}`)
      }
      if (isWithin(entry.path, cwd)) {
        throw new WorktreeError('IN_USE', `cannot bring back ${JSON.stringify(name.trim())} from inside it; run /worktree bring-back in the main workspace`)
      }
      if (!(await isClean(root, signal))) {
        throw new WorktreeError('MAIN_DIRTY', 'main workspace has uncommitted changes; commit or stash them first (bring-back requires a clean main workspace)')
      }
      const msg = message?.trim() || `worktree: ${entry.name}`
      await ensureCommitted(entry, msg, signal)
      const merged = await git(['merge', '--no-ff', '--no-edit', entry.branch], root, signal)
      if (merged.exitCode !== 0) {
        // Merge left conflicts; git staged what it could. Surface the state.
        throw new WorktreeError('MERGE_CONFLICT', `merge of ${entry.branch} into main workspace conflicted (git state kept): ${merged.stderr || 'resolve and commit manually'}`)
      }
      entry.state = 'brought-back'
      entry.broughtBackAt = new Date().toISOString()
      await saveManifest(root, manifest)
      const head = (await git(['rev-parse', 'HEAD'], root, signal)).stdout
      return { repoRoot: root, name: entry.name, branch: entry.branch, mainHead: head }
    },

    /**
     * Remove a worktree and its branch; refuses to remove the one the current
     * session is working inside.
     * @param {object} params - `name`, `cwd`, `currentDir`, `force`.
     */
    async remove({ name, cwd, currentDir, force = false, signal }) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      const entry = manifest?.worktrees.find((candidate) => candidate.name === name.trim())
      if (!entry) {
        throw new WorktreeError('NOT_FOUND', `no registered worktree named ${JSON.stringify(name.trim())} in ${root}`)
      }
      if (currentDir !== undefined && isWithin(entry.path, currentDir)) {
        throw new WorktreeError('IN_USE', `cannot remove worktree ${JSON.stringify(name.trim())}: the current session is working inside it (${currentDir})`)
      }
      const argv = force ? ['worktree', 'remove', '--force', entry.path] : ['worktree', 'remove', entry.path]
      const removed = await git(argv, root, signal)
      if (removed.exitCode !== 0) {
        // A merge-able branch deletion is best-effort; worktree removal failure is loud.
        throw new WorktreeError('GIT_FAILED', `git worktree remove failed: ${removed.stderr || removed.stdout}`)
      }
      const delBranch = await git(['branch', '-D', entry.branch], root, signal)
      if (delBranch.exitCode !== 0 && !/not fully merged/u.test(delBranch.stderr)) {
        // Branch already gone is fine; a not-fully-merged refusal is surfaced only if force is off.
        if (force) await git(['branch', '-D', entry.branch], root, signal).catch(() => {})
      }
      manifest.worktrees = manifest.worktrees.filter((candidate) => candidate.name !== name.trim())
      await saveManifest(root, manifest)
      return { name: entry.name, path: entry.path, repoRoot: root, removed: true, force, branch: entry.branch }
    },

    /**
     * Drop manifest records whose checkout no longer exists (e.g. removed
     * manually with git). Returns the pruned names.
     */
    async prune({ cwd, signal }) {
      const root = await resolveRepoRoot(cwd, signal)
      const manifest = await loadManifest(root)
      if (!manifest) return { repoRoot: root, pruned: [] }
      const live = await liveWorktrees(root, signal)
      const pruned = []
      const kept = manifest.worktrees.filter((entry) => {
        if (live.has(canonical(entry.path))) return true
        pruned.push(entry.name)
        return false
      })
      if (pruned.length > 0) {
        manifest.worktrees = kept
        await saveManifest(root, manifest)
      }
      return { repoRoot: root, pruned }
    },
  }
}