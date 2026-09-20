/**
 * Unit test for the browser preference store (no DOM, no harness).
 * The client half is TypeScript, so this relies on Node's native type
 * stripping (Node 22.6+/24); on an older runtime the suite skips itself rather
 * than failing the build.
 * Run: node test/prefs.mjs
 */
let createPrefsStore, choiceOf, PREFS_FALLBACK, SETTINGS_NS
try {
  ({ createPrefsStore, choiceOf, PREFS_FALLBACK, SETTINGS_NS } = await import('../src/client/worktreePrefs.ts'))
} catch (error) {
  console.log(`SKIP prefs — this Node cannot import TypeScript sources (${error.code ?? error.message}); requires Node 22.6+`)
  process.exit(0)
}

let failed = 0
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${label}`)
  } else {
    failed += 1
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/**
 * A stand-in for the client settings scope.
 * @param behavior - `accept` folds a write into the snapshot, `refuse` leaves it
 *   unchanged (the transport resolves either way — that is the whole point).
 */
function fakeBinder(section, behavior = 'accept') {
  const listeners = new Set()
  const writes = []
  let spec
  let snapshot = {
    status: 'ready',
    value: section,
    writable: true,
  }
  const applyOps = (ops) => {
    for (const op of ops) {
      writes.push({ op: op.op, field: op.path[0], value: op.value })
      if (behavior !== 'accept' || op.op !== 'set') continue
      snapshot = { ...snapshot, value: { ...snapshot.value, [op.path[0]]: op.value } }
    }
  }
  const scope = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async set(field, value) {
      applyOps([{ op: 'set', path: [field], value }])
    },
    async mutate(ops) {
      applyOps(ops)
    },
  }
  return {
    binder: { bind: (bound) => { spec = bound; return scope } },
    writes,
    getSpec: () => spec,
    publish(next) {
      snapshot = next
      for (const listener of listeners) listener()
    },
  }
}

console.log('binding')
{
  const fake = fakeBinder({ defaultMode: 'worktree', rememberLastChoice: false })
  const store = createPrefsStore()
  const unsubscribe = store.bind(fake.binder)
  check('binds the plugin namespace', fake.getSpec().namespace === SETTINGS_NS, fake.getSpec().namespace)
  check('declares a decoder', typeof fake.getSpec().decode === 'function')
  check('adopts the accepted section', store.getSnapshot().defaultMode === 'worktree' && store.getSnapshot().rememberLastChoice === false, JSON.stringify(store.getSnapshot()))
  check('reports the scope as available', store.getSnapshot().available === true)
  check('the decoder narrows known values', JSON.stringify(fake.getSpec().decode({ defaultMode: 'worktree', rememberLastChoice: true })) === JSON.stringify({ defaultMode: 'worktree', rememberLastChoice: true }))
  check('an absent or non-boolean remember flag means off', fake.getSpec().decode({ defaultMode: 'worktree', rememberLastChoice: 'yes' }).rememberLastChoice === false && fake.getSpec().decode({ defaultMode: 'worktree' }).rememberLastChoice === false)
  check('the decoder rejects a non-object section', fake.getSpec().decode(undefined) === undefined && fake.getSpec().decode('nonsense') === undefined)
  check('unbinding is a function', typeof unsubscribe === 'function')
  unsubscribe()
}

console.log('reactivity')
{
  const fake = fakeBinder({ defaultMode: 'local', rememberLastChoice: true })
  const store = createPrefsStore()
  store.bind(fake.binder)
  let notified = 0
  const unsubscribe = store.subscribe(() => { notified += 1 })
  fake.publish({ status: 'ready', value: { defaultMode: 'worktree', rememberLastChoice: true }, writable: true })
  check('a committed change notifies once', notified === 1 && store.getSnapshot().defaultMode === 'worktree', `${notified} / ${JSON.stringify(store.getSnapshot())}`)
  fake.publish({ status: 'ready', value: { defaultMode: 'worktree', rememberLastChoice: true }, writable: true })
  check('an equal snapshot does not notify', notified === 1)
  unsubscribe()
}

console.log('the three-way panel choice')
{
  check('pinned local reads as local', choiceOf({ defaultMode: 'local', rememberLastChoice: false }) === 'local')
  check('pinned worktree reads as worktree', choiceOf({ defaultMode: 'worktree', rememberLastChoice: false }) === 'worktree')
  check('remembering reads as last, whatever is remembered', choiceOf({ defaultMode: 'local', rememberLastChoice: true }) === 'last' && choiceOf({ defaultMode: 'worktree', rememberLastChoice: true }) === 'last')
}

console.log('writes')
{
  const fake = fakeBinder({ defaultMode: 'local', rememberLastChoice: true })
  const store = createPrefsStore()
  store.bind(fake.binder)

  const accepted = await store.setDefaultMode('worktree')
  check('an accepted write reports true', accepted === true, JSON.stringify(store.getSnapshot()))
  check('the remembered pick only touches defaultMode', JSON.stringify(fake.writes) === JSON.stringify([{ op: 'set', field: 'defaultMode', value: 'worktree' }]), JSON.stringify(fake.writes))
  check('remembering stays on', store.getSnapshot().rememberLastChoice === true && choiceOf(store.getSnapshot()) === 'last')

  fake.writes.length = 0
  check('pinning worktree is one atomic mutation', (await store.setNewConversationChoice('worktree')) === true)
  check('it writes both fields', JSON.stringify(fake.writes) === JSON.stringify([
    { op: 'set', field: 'defaultMode', value: 'worktree' },
    { op: 'set', field: 'rememberLastChoice', value: false },
  ]), JSON.stringify(fake.writes))
  check('the panel now reads pinned worktree', choiceOf(store.getSnapshot()) === 'worktree')

  fake.writes.length = 0
  check('choosing "remember" writes only the flag', (await store.setNewConversationChoice('last')) === true)
  check('and keeps the last mode as the value', JSON.stringify(fake.writes) === JSON.stringify([{ op: 'set', field: 'rememberLastChoice', value: true }]) && store.getSnapshot().defaultMode === 'worktree', JSON.stringify(fake.writes))

  const refusing = fakeBinder({ defaultMode: 'local', rememberLastChoice: true }, 'refuse')
  const refused = createPrefsStore()
  refused.bind(refusing.binder)
  check('a transport that resolves while the host refuses reports false', (await refused.setNewConversationChoice('worktree')) === false)
}

console.log('without a bound scope')
{
  const store = createPrefsStore()
  check('the fallback is local, without remembering, unavailable', store.getSnapshot().defaultMode === 'local' && store.getSnapshot().rememberLastChoice === false && store.getSnapshot().available === false, JSON.stringify(store.getSnapshot()))
  check('the fallback reads as the pinned local choice', choiceOf(store.getSnapshot()) === 'local')
  check('the fallback reports loading, not unavailable', store.getSnapshot().status === 'loading')
  check('the exported fallback matches', store.getSnapshot().defaultMode === PREFS_FALLBACK.defaultMode && store.getSnapshot().available === PREFS_FALLBACK.available)
  check('a write without a scope reports false', (await store.setDefaultMode('worktree')) === false)
}

console.log('unavailable / unwritable scope')
{
  const fake = fakeBinder({ defaultMode: 'worktree', rememberLastChoice: true })
  const store = createPrefsStore()
  store.bind(fake.binder)
  fake.publish({ status: 'unavailable', value: undefined, writable: false })
  check('reports unavailable', store.getSnapshot().available === false && store.getSnapshot().status === 'unavailable')
  check('falls back to local while unavailable', store.getSnapshot().defaultMode === 'local', JSON.stringify(store.getSnapshot()))
}

console.log(failed === 0 ? '\nPREFS OK — all checks passed' : `\nPREFS FAILED — ${failed} check(s) failed`)
process.exit(failed === 0 ? 0 : 1)
