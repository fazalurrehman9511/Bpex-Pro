import { BPEXCH_DASHBOARD_URL, BPEXCH_LOGIN_URL } from '../config/embed'
import {
  getBpexchAuthToken,
  setBpexchLoggedIn,
  setBpexchUsername,
} from './bpexchAuth'

const BPEXCH_AUTHENTICATE_URL = '/bpexch/api/Users/authenticate'
const DEBUG_BPEXCH = import.meta.env.DEV || import.meta.env.VITE_BPEXCH_DEBUG === 'true'

let inFlightKey = ''
let inFlightPromise = null

function extractAntiForgery(html = '') {
  const match = String(html).match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/,
  )
  return match?.[1] || match?.[2] || ''
}

function writeCookie(name, value, maxAgeSeconds = 12 * 60 * 60) {
  const cookieName = String(name || '').trim()
  const cookieValue = String(value || '').trim()
  if (!cookieName || !cookieValue || typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${cookieName}=${encodeURIComponent(cookieValue)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`
}

function expireCookie(name) {
  const cookieName = String(name || '').trim()
  if (!cookieName || typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax${secure}`
}

function clearBpexchAuthCookies() {
  expireCookie('wex3authtoken')
  expireCookie('wex3reftoken')
}

function nowMs() {
  try {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
  } catch {
    return Date.now()
  }
}

function roundMs(value) {
  return Math.max(0, Math.round(Number(value) || 0))
}

function logBpexchDebug(event, detail = {}) {
  if (!DEBUG_BPEXCH) return
  console.info(`[bpexch] ${event}`, detail)
}

function pickAuthTokens(data = {}) {
  return {
    authToken:
      data.token || data.accessToken || data.authToken || data.wex3authtoken || data.Token || '',
    refreshToken:
      data.refreshToken ||
      data.refToken ||
      data.refresh ||
      data.wex3reftoken ||
      data.RefreshToken ||
      '',
  }
}

function warmDashboardDocument() {
  try {
    fetch(BPEXCH_DASHBOARD_URL, {
      credentials: 'include',
      cache: 'no-store',
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

async function tryApiLogin({ username, password }) {
  const res = await fetch(BPEXCH_AUTHENTICATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      identity: 'FlowExch-Web',
    }),
    credentials: 'include',
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.message || `BPEXCH login failed (${res.status})`)
  }

  const { authToken, refreshToken } = pickAuthTokens(data)
  if (authToken) writeCookie('wex3authtoken', authToken)
  if (refreshToken) writeCookie('wex3reftoken', refreshToken)

  return Boolean(authToken || refreshToken || getBpexchAuthToken())
}

async function tryFormLogin({ username, password }) {
  const page = await fetch(BPEXCH_LOGIN_URL, {
    credentials: 'include',
    cache: 'no-store',
  })
  const html = await page.text().catch(() => '')
  const antiForgeryToken = extractAntiForgery(html)

  const body = new URLSearchParams()
  body.set('user.Username', username)
  body.set('user.Password', password)
  body.set('Device', 'FlowExch-Web')
  body.set('UtcOffset', String(-new Date().getTimezoneOffset()))
  if (antiForgeryToken) body.set('__RequestVerificationToken', antiForgeryToken)

  const res = await fetch(BPEXCH_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    body: body.toString(),
    credentials: 'include',
    redirect: 'follow',
    cache: 'no-store',
  })

  if (getBpexchAuthToken()) return true

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}))
    const { authToken, refreshToken } = pickAuthTokens(data)
    if (authToken) writeCookie('wex3authtoken', authToken)
    if (refreshToken) writeCookie('wex3reftoken', refreshToken)
    return Boolean(authToken || refreshToken || getBpexchAuthToken())
  }

  const text = await res.text().catch(() => '')
  return !/login100-form|Users\/Login/i.test(text.slice(0, 4000))
}

export async function ensureBpexchSession({ username, password, force = false } = {}) {
  const user = String(username || '').trim()
  const pass = String(password || '')
  if (!user || !pass) return false

  if (!force && getBpexchAuthToken()) return true

  const nextKey = `${user.toLowerCase()}\n${pass}`
  if (!force && inFlightPromise && inFlightKey === nextKey) {
    return inFlightPromise
  }

  const startedAt = nowMs()
  const promise = (async () => {
    if (force) clearBpexchAuthCookies()
    logBpexchDebug('session-start', { user, force })

    try {
      const apiOk = await tryApiLogin({ username: user, password: pass })
      if (apiOk) {
        setBpexchUsername(user)
        setBpexchLoggedIn(true, user)
        warmDashboardDocument()
        logBpexchDebug('session-ready', {
          user,
          mode: 'api',
          force,
          ms: roundMs(nowMs() - startedAt),
        })
        return true
      }
    } catch {
      /* form fallback below */
    }

    const formOk = await tryFormLogin({ username: user, password: pass })
    if (formOk || getBpexchAuthToken()) {
      setBpexchUsername(user)
      setBpexchLoggedIn(true, user)
      warmDashboardDocument()
      logBpexchDebug('session-ready', {
        user,
        mode: 'form',
        force,
        ms: roundMs(nowMs() - startedAt),
      })
      return true
    }

    logBpexchDebug('session-miss', {
      user,
      force,
      ms: roundMs(nowMs() - startedAt),
    })
    return false
  })().finally(() => {
    if (inFlightPromise === promise) {
      inFlightKey = ''
      inFlightPromise = null
    }
  })

  inFlightKey = nextKey
  inFlightPromise = promise
  return promise
}

export function primeBpexchSession(options = {}) {
  void ensureBpexchSession(options).catch(() => {})
}

export { logBpexchDebug }
