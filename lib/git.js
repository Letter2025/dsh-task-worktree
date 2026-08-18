/**
 * Git runners for managed worktrees. Two implementations share one API:
 * - createSubprocessRunner(ctx): production path through DSH's own
 *   `ctx.subprocess` seam (harness-managed process trees, sandbox semantics).
 * - createProcessRunner(): standalone path via child_process, used by tests
 *   and the smoke harness without booting a DSH profile.
 *
 * @module dsh-task-worktree/git
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const GIT_COLLECT_BYTES = 1 << 20
const GIT_GRACE_MS = 30_000

function isSubprocessLike(value) {
  return Boolean(value) && typeof value === 'object' && typeof value.spawn === 'function'
}

/**
 * Runner over DSH's ctx.subprocess seam.
 * @param ctx - cordis context exposing `ctx.subprocess`.
 * @returns a GitRunner `(args, cwd, signal?, opts?) => {exitCode, stdout, stderr}`.
 */
export function createSubprocessRunner(ctx) {
  if (!isSubprocessLike(ctx.get ? ctx.get('subprocess') : ctx.subprocess)) {
    throw new Error('ctx.subprocess service unavailable')
  }
  const collect = (opts, text) => {
    if (opts?.raw) return text ?? ''
    return (text ?? '').trim()
  }
  return async (args, cwd, signal, opts) => {
    const handle = ctx.get('subprocess').spawn({
      argv: ['git', ...args],
      cwd,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: GIT_COLLECT_BYTES },
        stderr: { maxBytes: GIT_COLLECT_BYTES },
      },
      graceMs: GIT_GRACE_MS,
      signal,
    })
    const outcome = await handle.done
    return {
      exitCode: outcome.exitCode,
      signalName: outcome.signal ?? null,
      stdout: collect(opts, handle.collected.stdout?.readFrom(0).text),
      stderr: collect(opts, handle.collected.stderr?.readFrom(0).text),
    }
  }
}

/**
 * Runner over child_process.execFile (no harness). Never shell-interpreted.
 * Pass `opts.raw` to keep stdout untrimmed (needed for patch files whose
 * trailing newline separates the final hunk from EOF).
 * @returns a GitRunner.
 */
export function createProcessRunner() {
  return async (args, cwd, signal, opts) => {
    try {
      const { stdout } = await exec('git', args, {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        maxBuffer: GIT_COLLECT_BYTES,
        signal,
      })
      return { exitCode: 0, signalName: null, stdout: opts?.raw ? stdout : stdout.trim(), stderr: '' }
    } catch (error) {
      if (error?.killed || error?.signal) {
        return { exitCode: error.code ?? 1, signalName: error.signal ?? null, stdout: '', stderr: '' }
      }
      return {
        exitCode: error.code ?? 1,
        signalName: null,
        stdout: '',
        stderr: String(error.stderr ?? error.message ?? error).trim(),
      }
    }
  }
}