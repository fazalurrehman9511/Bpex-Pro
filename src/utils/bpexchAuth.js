const FLAG_KEY = 'flowexch_bpexch_logged_in'
const USERNAME_KEY = 'flowexch_bpexch_username'
const EVENT = 'flowexch-auth-change'

function readCookie(name) {
  try {
    const raw = `; ${document.cookie}`
    const parts = raw.split(`; ${name}=`)
    if (parts.length < 2) return ''
    return decodeURIComponent(parts.pop().split(';').shift() || '').trim()
  } catch {
    return ''
  }
}

export function getBpexchAuthToken() {
  return readCookie('wex3authtoken') || readCookie('wex3reftoken') || ''
}

export function getBpexchUsername() {
  if (typeof window === 'undefined') return ''
  try {
    return String(sessionStorage.getItem(USERNAME_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function setBpexchUsername(username) {
  const u = String(username || '').trim()
  try {
    if (u) sessionStorage.setItem(USERNAME_KEY, u)
    else sessionStorage.removeItem(USERNAME_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: { loggedIn: isBpexchLoggedIn(), username: u },
      }),
    )
  }
}

export function isBpexchLoggedIn() {
  if (typeof window === 'undefined') return false
  if (getBpexchAuthToken()) return true
  try {
    return sessionStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function setBpexchLoggedIn(loggedIn, username) {
  try {
    if (loggedIn) {
      sessionStorage.setItem(FLAG_KEY, '1')
      const u = String(username || '').trim()
      if (u) sessionStorage.setItem(USERNAME_KEY, u)
    } else {
      // Keep username — deposit/withdraw still need last BPEXCH login id.
      // Cleared only via setBpexchUsername('') or logout rewrite.
      sessionStorage.removeItem(FLAG_KEY)
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: {
          loggedIn: Boolean(loggedIn),
          username: getBpexchUsername(),
        },
      }),
    )
  }
}

/** React hook-friendly subscription — calls listener(loggedIn) */
export function subscribeBpexchAuth(listener) {
  const onChange = () => listener(isBpexchLoggedIn())
  const onStorage = (e) => {
    if (e.key === FLAG_KEY || e.key === USERNAME_KEY) onChange()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

/** Subscribe to stored BPEXCH username changes */
export function subscribeBpexchUsername(listener) {
  const onChange = () => listener(getBpexchUsername())
  const onStorage = (e) => {
    if (e.key === USERNAME_KEY) onChange()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}
