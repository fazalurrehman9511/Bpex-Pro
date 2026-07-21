const FLAG_KEY = 'flowexch_bpexch_logged_in'
const USERNAME_KEY = 'flowexch_bpexch_username'
const PASSWORD_KEY = 'flowexch_bpexch_password'
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

function storageGet(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || ''
  } catch {
    try {
      return sessionStorage.getItem(key) || ''
    } catch {
      return ''
    }
  }
}

function storageSet(key, value) {
  try {
    if (value) {
      localStorage.setItem(key, value)
      sessionStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  } catch {
    try {
      if (value) sessionStorage.setItem(key, value)
      else sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

/** Best-effort username claim from JWT auth cookie */
export function usernameFromAuthToken(token = getBpexchAuthToken()) {
  const raw = String(token || '').trim()
  if (!raw || raw.split('.').length < 2) return ''
  try {
    const b64 = raw.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    const candidates = [
      payload.unique_name,
      payload.username,
      payload.preferred_username,
      payload.name,
      payload.user_name,
      payload.login,
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
      ],
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
      ],
      payload.sub,
    ]
    for (const c of candidates) {
      const s = String(c || '').trim()
      if (s && s.length <= 64 && !s.includes('@') && !/^\d{10,}$/.test(s)) return s
      // email-style usernames ok; numeric-only long ids skip
      if (s && s.length <= 64 && s.includes('@')) return s.split('@')[0]
    }
  } catch {
    /* ignore */
  }
  return ''
}

export function getBpexchAuthToken() {
  return readCookie('wex3authtoken') || readCookie('wex3reftoken') || ''
}

export function getBpexchUsername() {
  if (typeof window === 'undefined') return ''
  const saved = String(storageGet(USERNAME_KEY) || '').trim()
  if (saved) return saved
  return usernameFromAuthToken()
}

export function setBpexchUsername(username) {
  const u = String(username || '').trim()
  storageSet(USERNAME_KEY, u)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: { loggedIn: isBpexchLoggedIn(), username: u },
      }),
    )
  }
}

export function getBpexchPassword() {
  if (typeof window === 'undefined') return ''
  return String(storageGet(PASSWORD_KEY) || '')
}

export function setBpexchPassword(password) {
  const p = String(password || '')
  storageSet(PASSWORD_KEY, p)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: {
          loggedIn: isBpexchLoggedIn(),
          username: getBpexchUsername(),
          password: p,
        },
      }),
    )
  }
}

export function isBpexchLoggedIn() {
  if (typeof window === 'undefined') return false
  if (getBpexchAuthToken()) return true
  return storageGet(FLAG_KEY) === '1'
}

export function setBpexchLoggedIn(loggedIn, username) {
  try {
    if (loggedIn) {
      storageSet(FLAG_KEY, '1')
      const u = String(username || '').trim() || usernameFromAuthToken()
      if (u) storageSet(USERNAME_KEY, u)
    } else {
      // Keep username until clearBpexchSession / setBpexchUsername('')
      storageSet(FLAG_KEY, '')
      try {
        sessionStorage.removeItem(FLAG_KEY)
        localStorage.removeItem(FLAG_KEY)
      } catch {
        /* ignore */
      }
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

function expireCookie(name) {
  try {
    document.cookie = `${name}=; Max-Age=0; path=/`
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`
  } catch {
    /* ignore */
  }
}

/** Full local logout — clears login flag, username, and auth cookies */
export function clearBpexchSession() {
  storageSet(FLAG_KEY, '')
  storageSet(USERNAME_KEY, '')
  storageSet(PASSWORD_KEY, '')
  try {
    sessionStorage.removeItem(FLAG_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
    sessionStorage.removeItem(PASSWORD_KEY)
    localStorage.removeItem(FLAG_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(PASSWORD_KEY)
  } catch {
    /* ignore */
  }
  expireCookie('wex3authtoken')
  expireCookie('wex3reftoken')
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: { loggedIn: false, username: '' },
      }),
    )
  }
}

/** React hook-friendly subscription — calls listener(loggedIn) */
export function subscribeBpexchAuth(listener) {
  const onChange = () => listener(isBpexchLoggedIn())
  const onStorage = (e) => {
    if (e.key === FLAG_KEY || e.key === USERNAME_KEY || e.key === PASSWORD_KEY) onChange()
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

export function subscribeBpexchPassword(listener) {
  const onChange = () => listener(getBpexchPassword())
  const onStorage = (e) => {
    if (e.key === PASSWORD_KEY) onChange()
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
