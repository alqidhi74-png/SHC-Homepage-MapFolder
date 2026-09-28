// Local UI prototype only. Replace this module with server authentication
// before connecting real admin data; a browser session is not access control.
export const DEMO_ADMIN_EMAIL = 'israa.alwahaibi@shc.gov.om'
const DEMO_ADMIN_PASSWORD = 'admin@190'
const SESSION_KEY = 'shc.demo-admin.session'
const SESSION_DURATION = 8 * 60 * 60 * 1000
const REMEMBER_DURATION = 7 * 24 * 60 * 60 * 1000

export function clearAdminSession() {
  for (const storageName of ['sessionStorage', 'localStorage']) {
    try {
      window[storageName].removeItem(SESSION_KEY)
    } catch {
      // Login still works in memory if browser storage is unavailable.
    }
  }
}

export function readAdminSession() {
  for (const storageName of ['sessionStorage', 'localStorage']) {
    try {
      const storage = window[storageName]
      const value = storage.getItem(SESSION_KEY)
      if (!value) continue

      let session
      try {
        session = JSON.parse(value)
      } catch {
        storage.removeItem(SESSION_KEY)
        continue
      }

      if (
        session?.email === DEMO_ADMIN_EMAIL &&
        session.role === 'admin' &&
        Number.isFinite(session.expiresAt) &&
        session.expiresAt > Date.now()
      ) {
        return { email: session.email, role: session.role, expiresAt: session.expiresAt }
      }

      storage.removeItem(SESSION_KEY)
    } catch {
      // A blocked storage area must not prevent the login page from opening.
    }
  }

  return null
}

export function signInDemoAdmin({ email, password, remember = false }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedPassword = String(password).replaceAll('\\@', '@')

  if (normalizedEmail !== DEMO_ADMIN_EMAIL || normalizedPassword !== DEMO_ADMIN_PASSWORD) {
    return null
  }

  const session = {
    email: DEMO_ADMIN_EMAIL,
    role: 'admin',
    expiresAt: Date.now() + (remember ? REMEMBER_DURATION : SESSION_DURATION),
  }

  clearAdminSession()
  try {
    const storage = remember ? window.localStorage : window.sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // The provider retains the session until the page is refreshed.
  }

  return session
}
