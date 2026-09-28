import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { clearAdminSession, readAdminSession, signInDemoAdmin } from './demoAdminAuth.js'

const key = 'shc.demo-admin.session'
const credentials = { email: 'israa.alwahaibi@shc.gov.om', password: 'admin@190' }
const originalWindow = globalThis.window

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, String(value)),
    removeItem: (name) => values.delete(name),
  }
}

beforeEach(() => {
  globalThis.window = { sessionStorage: memoryStorage(), localStorage: memoryStorage() }
})

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

test('wrong credentials do not create a session', () => {
  assert.equal(signInDemoAdmin({ ...credentials, password: 'wrong-password' }), null)
  assert.equal(signInDemoAdmin({ ...credentials, email: 'someone@shc.test' }), null)
  assert.equal(readAdminSession(), null)
})

test('valid login can be restored after a page refresh without storing the password', () => {
  const session = signInDemoAdmin({ ...credentials, email: `  ${credentials.email.toUpperCase()}  ` })
  assert.equal(session.email, credentials.email)
  assert.equal(session.role, 'admin')
  assert.deepEqual(readAdminSession(), session)
  assert.ok(window.sessionStorage.getItem(key))
  assert.equal(window.localStorage.getItem(key), null)
  assert.equal(window.sessionStorage.getItem(key).includes(credentials.password), false)
})

test('remember me persists for a new tab and is cleared by a later session-only login', () => {
  const remembered = signInDemoAdmin({ ...credentials, remember: true })
  window.sessionStorage = memoryStorage()
  assert.deepEqual(readAdminSession(), remembered)
  const sessionOnly = signInDemoAdmin(credentials)
  assert.equal(window.localStorage.getItem(key), null)
  assert.deepEqual(readAdminSession(), sessionOnly)
  assert.ok(remembered.expiresAt > sessionOnly.expiresAt)
})

test('session-only login does not persist after tab storage is cleared', () => {
  signInDemoAdmin(credentials)
  window.sessionStorage = memoryStorage()
  assert.equal(readAdminSession(), null)
})

test('sign out clears both storage areas', () => {
  const session = signInDemoAdmin({ ...credentials, remember: true })
  window.sessionStorage.setItem(key, JSON.stringify(session))
  clearAdminSession()
  assert.equal(readAdminSession(), null)
  assert.equal(window.localStorage.getItem(key), null)
  assert.equal(window.sessionStorage.getItem(key), null)
})

test('expired or corrupted sessions are discarded', () => {
  for (const value of [
    'invalid-json',
    'null',
    JSON.stringify({ email: credentials.email, role: 'admin', expiresAt: Date.now() - 1 }),
    JSON.stringify({ email: credentials.email, role: 'visitor', expiresAt: Date.now() + 60_000 }),
  ]) {
    window.localStorage.setItem(key, value)
    assert.equal(readAdminSession(), null)
    assert.equal(window.localStorage.getItem(key), null)
  }
})

test('blocked browser storage allows in-memory login without crashing', () => {
  Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked') } })
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked') } })
  assert.equal(readAdminSession(), null)
  assert.equal(signInDemoAdmin(credentials).role, 'admin')
  assert.doesNotThrow(clearAdminSession)
})
