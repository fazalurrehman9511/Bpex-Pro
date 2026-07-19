const FLAG_KEY = 'flowexch_bpexch_logged_in'
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

export function isBpexchLoggedIn() {
  if (typeof window === 'undefined') return false
  if (getBpexchAuthToken()) return true
  try {
    return sessionStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function setBpexchLoggedIn(loggedIn) {
  try {
    if (loggedIn) sessionStorage.setItem(FLAG_KEY, '1')
    else sessionStorage.removeItem(FLAG_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { loggedIn: Boolean(loggedIn) } }))
  }
}

/** React hook-friendly subscription */
export function subscribeBpexchAuth(listener) {
  const onChange = () => listener(isBpexchLoggedIn())
  const onStorage = (e) => {
    if (e.key === FLAG_KEY) onChange()
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
