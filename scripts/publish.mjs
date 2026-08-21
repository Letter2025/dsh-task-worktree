#!/usr/bin/env node
/**
 * Manual release helper for `dsh-task-worktree` (Node 20+, no dependencies).
 *
 *   node scripts/publish.mjs --dry-run   run every release check, publish nothing
 *   node scripts/publish.mjs             run checks, then `npm publish --access public`
 *
 * Design notes:
 * - The registry pre-check goes through the same `npm` config (registry,
 *   proxy, auth) that `npm publish` will use, so a version that already
 *   exists there aborts the release before anything else runs.
 * - No token or OTP is ever read from files, environment variables, or CLI
 *   arguments. The real publish path hands the terminal to `npm publish`
 *   (inherited stdio) so the maintainer completes npm's interactive
 *   authentication / 2FA flow.
 * - Fails fast on the first failed check. `--dry-run` never publishes and
 *   never writes a tarball.
 */
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
if (args.includes('-h') || args.includes('--help')) {
  console.log(`Usage:
  node scripts/publish.mjs --dry-run   release checks only; never publishes
  node scripts/publish.mjs             release checks, then a real npm publish
`)
  process.exit(0)
}
const isDryRun = args.includes('--dry-run')
for (const flag of args) {
  if (flag !== '--dry-run') {
    console.error(`publish.mjs: unknown argument "${flag}"`)
    console.error('Run `node scripts/publish.mjs --help` for usage.')
    process.exit(2)
  }
}

/** Run a child process with output piped to the current terminal. */
function runInherit(command, commandArgs, label) {
  return new Promise((resolvePromise, rejectPromise) => {
    let child
    try {
      child = spawn(command, commandArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
    } catch (err) {
      rejectPromise(new Error(`${label}: failed to start "${command}": ${err.message}`))
      return
    }
    child.on('error', (err) => rejectPromise(new Error(`${label}: failed to start "${command}": ${err.message}`)))
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`${label} exited with code ${code}`))
    })
  })
}

/** Run a child process and capture its stdout/stderr. */
function runCapture(command, commandArgs, label, maxBuffer = 16 * 1024 * 1024) {
  return new Promise((resolvePromise, rejectPromise) => {
    let child
    try {
      child = spawn(command, commandArgs, {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      })
    } catch (err) {
      rejectPromise(new Error(`${label}: failed to start "${command}": ${err.message}`))
      return
    }
    let stdout = ''
    let stderr = ''
    let overflow = false
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (stdout.length > maxBuffer) overflow = true
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      if (stderr.length > maxBuffer) overflow = true
    })
    child.on('error', (err) => rejectPromise(new Error(`${label}: failed to start "${command}": ${err.message}`)))
    child.on('close', (code) => resolvePromise({ code, stdout, stderr, overflow }))
  })
}

/** Locate the `npm` executable for this platform (npm.cmd on Windows). */
function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

async function main() {
  const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8'))
  const { name, version } = pkg

  if (name !== 'dsh-task-worktree') {
    throw new Error(`package identity check failed: expected name "dsh-task-worktree", found "${name}"`)
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`unexpected version format "${version}" in package.json (expected x.y.z)`)
  }

  console.log(`\ndsh-task-worktree@${version} — ${isDryRun ? 'DRY RUN (nothing will be published or packed)' : 'REAL PUBLISH'}\n`)

  // ── 1. Registry pre-check: the version to publish must not already exist. ──
  console.log('[1/6] Checking the registry for existing versions ...')
  const reg = await runCapture(npmCommand(), ['view', name, 'versions', '--json'], 'registry check')
  if (reg.overflow) throw new Error('registry check output was unexpectedly large')
  let published = []
  if (reg.code === 0) {
    try {
      const parsed = JSON.parse(reg.stdout)
      if (!Array.isArray(parsed)) throw new Error('unexpected shape')
      published = parsed
    } catch {
      throw new Error(`registry check: could not parse the version list from "npm view":\n${reg.stdout.slice(0, 500)}`)
    }
    if (published.includes(version)) {
      throw new Error(`${name}@${version} is ALREADY PUBLISHED on the registry — bump the version in package.json first`)
    }
    const summary = published.length > 0 ? published.join(', ') : 'none yet'
    console.log(`  ok  ${name}@${version} is not published (published so far: ${summary})`)
  } else if (/E404|not found/i.test(reg.stderr)) {
    console.log(`  ok  ${name} has no published versions yet — ${version} is available`)
  } else {
    throw new Error(
      `registry check: "npm view" exited with code ${reg.code}. Refusing to release without a confirmed version.\n` +
        `${reg.stderr.slice(-2000)}`,
    )
  }

  // ── 2-4. Static checks and build. Fail fast on the first failure. ──
  console.log('[2/6] Running typecheck ...')
  await runInherit(npmCommand(), ['run', 'typecheck'], 'npm run typecheck')
  console.log('  ok  typecheck passed')

  console.log('[3/6] Running tests ...')
  await runInherit(npmCommand(), ['test'], 'npm test')
  console.log('  ok  tests passed')

  console.log('[4/6] Building the client bundle ...')
  await runInherit(npmCommand(), ['run', 'build:client'], 'npm run build:client')
  console.log('  ok  client bundle built')

  // ── 5. Packaging inspection: the tarball must contain the runtime files and ──
  // ──    nothing sensitive/source-only (belt-and-braces over the `files` allowlist). ──
  console.log('[5/6] Inspecting the would-be package contents ...')
  const pack = await runCapture(npmCommand(), ['pack', '--dry-run', '--json'], 'pack inspection')
  if (pack.overflow) throw new Error('pack inspection output was unexpectedly large')
  if (pack.code !== 0) {
    throw new Error(`pack inspection: "npm pack --dry-run" exited with code ${pack.code}\n${pack.stderr.slice(-2000)}`)
  }
  const packResult = JSON.parse(pack.stdout)
  const manifest = Array.isArray(packResult) ? packResult[0] : packResult
  const entries = Array.isArray(manifest?.files) ? manifest.files : []
  // npm >= 11 no longer emits a per-entry `type` in `npm pack --json`, so only
  // exclude entries that are explicitly directories; everything else is a file.
  const paths = entries
    .filter((entry) => entry.type !== 'directory')
    .map((entry) => entry.path.replace(/^\.\//u, '').replaceAll('\\', '/'))

  const required = [
    'package.json',
    'lib/index.js',
    'client/client.js',
    'cordis.patch.yml',
    'README.md',
    'README.zh.md',
    'LICENSE',
  ]
  const missing = required.filter((path) => !paths.includes(path))
  if (missing.length > 0) {
    throw new Error(`pack inspection: required runtime files missing from the package: ${missing.join(', ')}`)
  }

  const forbidden = [
    /\.(?:png|jpe?g|gif|webp|bmp|ico)$/iu,
    /design-qa/iu,
    /implementation-3081/iu,
    /(?:^|\/)src\//u,
    /(?:^|\/)test\//u,
    /(?:^|\/)scripts\//u,
    /(?:^|\/)node_modules\//u,
    /\.tgz$/iu,
    /(?:^|\/)\.npmrc$/iu,
    /(?:^|\/)UI-PLAN\.md$/iu,
  ]
  const leaks = paths.filter((path) => forbidden.some((pattern) => pattern.test(path)))
  if (leaks.length > 0) {
    throw new Error(`pack inspection: unexpected entries in the package (files allowlist should have excluded them):\n${leaks.join('\n')}`)
  }
  console.log(`  ok  package contains ${paths.length} files; runtime files present and no QA/source/credential files found`)

  console.log('[6/6] release checks complete')

  if (isDryRun) {
    console.log('\nDRY RUN COMPLETE — all release checks passed. Nothing was published and no tarball was written.')
    console.log(`Run \`npm run release\` (or: node scripts/publish.mjs) to publish dsh-task-worktree@${version}.`)
    return
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      'refusing to run a real publish without an interactive terminal: npm publish needs it for authentication/2FA. ' +
        'Use the --dry-run mode in CI or scripts.',
    )
  }

  console.log('\nAll release checks passed. Starting the real npm publish ...')
  console.log('npm will prompt you to authenticate and approve the OTP/2FA. Press Ctrl+C to abort.')
  await runInherit(npmCommand(), ['publish', '--access', 'public'], 'npm publish')

  console.log(`\nPublish complete: dsh-task-worktree@${version} is now live on the registry.`)
  console.log('Verify with: npm view dsh-task-worktree')
}

main().catch((err) => {
  console.error(`\nRELEASE ABORTED: ${err.message}`)
  process.exit(1)
})