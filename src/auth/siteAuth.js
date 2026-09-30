// Versioned key: old demo-service sessions must not unlock protected portals.
export const SITE_AUTH_KEY = 'sh_site_logged_in_v2'
export const SITE_PROFILE_KEY = 'sh_site_profile_v2'

export function isSiteAuthenticated() {
  try {
    if (window.localStorage.getItem(SITE_AUTH_KEY) !== '1') return false
    const profile = JSON.parse(window.localStorage.getItem(SITE_PROFILE_KEY) || 'null')
    return profile?.role === 'citizen'
  } catch {
    return false
  }
}

export function setSiteAuthenticated(authenticated = true, profile = null) {
  try {
    if (authenticated) {
      window.localStorage.setItem(SITE_AUTH_KEY, '1')
      window.localStorage.setItem(SITE_PROFILE_KEY, JSON.stringify({
        name: String(profile?.name || 'المستخدم'),
        role: 'citizen',
      }))
    } else {
      window.localStorage.removeItem(SITE_AUTH_KEY)
      window.localStorage.removeItem(SITE_PROFILE_KEY)
    }
  } catch {
    // The current session can continue even when storage is unavailable.
  }
}

export function getSiteProfile() {
  if (!isSiteAuthenticated()) return null

  try {
    const stored = window.localStorage.getItem(SITE_PROFILE_KEY)
    if (!stored) return null

    const profile = JSON.parse(stored)
    if (profile?.role !== 'citizen') return null
    return {
      name: String(profile?.name || 'المستخدم'),
      role: 'citizen',
    }
  } catch {
    return null
  }
}

export function getSafeReturnTarget() {
  const target = new URLSearchParams(window.location.search).get('returnTo')

  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return null
  }

  return target
}
