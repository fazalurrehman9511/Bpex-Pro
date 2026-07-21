/**
 * Create a Bettor on BPEXCH using agent/master credentials, then mirror in local DB.
 *
 * Credentials: Super Admin DB config, fallback .env BPEXCH_AGENT_* / BPEXCH_LIVE_*
 */

import { getBpexchAgentConfig } from '../db.js'
import {
  bpexchHttpFetch,
  createBpexchProxyRequiredError,
  getBpexchProxyRequiredMessage,
} from './bpexchHttp.js'

const BPEXCH_ORIGIN = process.env.BPEXCH_BASE_URL || 'https://bpexch.xyz'

function agentCredentials() {
  const cfg = getBpexchAgentConfig()
  return { username: cfg.username, password: cfg.password }
}

function parseCookieJar(existing, res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const list = raw.length ? [...raw] : []
  if (!list.length) {
    const single = res.headers.get('set-cookie')
    if (single) list.push(single)
  }
  const map = new Map()
  for (const c of String(existing || '')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)) {
    const i = c.indexOf('=')
    if (i > 0) map.set(c.slice(0, i), c.slice(i + 1))
  }
  for (const line of list) {
    const part = String(line).split(';')[0]
    const i = part.indexOf('=')
    if (i > 0) map.set(part.slice(0, i), part.slice(i + 1))
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function bpexchFetch(session, pathName, options = {}) {
  const headers = {
    Accept: options.accept || 'application/json, text/html;q=0.9,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...(options.headers || {}),
  }
  if (session.cookies) headers.Cookie = session.cookies
  if (session.authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.authToken}`
  }

  const res = await bpexchHttpFetch(`${BPEXCH_ORIGIN}${pathName}`, {
    ...options,
    headers,
    redirect: 'manual',
  })
  session.cookies = parseCookieJar(session.cookies, res)
  return res
}

function extractAntiForgery(html = '') {
  const match = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/
  )
  return match?.[1] || match?.[2] || ''
}

function proxyBlockedError(message = 'BPEXCH rejected the request (403).') {
  return createBpexchProxyRequiredError(
    `${message} ${getBpexchProxyRequiredMessage()}`.trim(),
  )
}

function parseClientUsernames(html = '') {
  const names = new Set()
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || []
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    const username = cells.length >= 2 ? cells[1] : ''
    if (!username || /^id$/i.test(username) || /^name$/i.test(username)) continue
    names.add(username.toLowerCase())
  }
  return names
}

async function getClientUsernameSet(session, { forceRefresh = false } = {}) {
  if (!forceRefresh && session.clientUsernames instanceof Set) {
    return session.clientUsernames
  }

  const res = await bpexchFetch(session, '/Users', { accept: 'text/html' })
  const html = await res.text()
  if (res.status !== 200 && !/Clients List/i.test(html)) {
    throw new Error('Could not open BPEXCH clients list')
  }

  session.clientUsernames = parseClientUsernames(html)
  return session.clientUsernames
}

async function assertUsernameAvailable(session, username) {
  const target = String(username || '').trim().toLowerCase()
  if (!target) return

  const existing = await getClientUsernameSet(session)
  if (existing.has(target)) {
    const err = new Error('Username already exists on BPEXCH')
    err.code = 'USERNAME_EXISTS'
    throw err
  }
}

async function loginAgent(session) {
  const { username, password } = agentCredentials()
  if (!username || !password) {
    throw new Error('BPEXCH agent credentials are not configured')
  }

  /* Cookie/session login first — required for /Users/Create form */
  const loginPage = await bpexchFetch(session, '/Users/Login', { accept: 'text/html' })
  if (loginPage.status === 403) {
    throw proxyBlockedError('BPEXCH blocked the login page (403).')
  }
  const html = await loginPage.text()
  const anti = extractAntiForgery(html)
  const body = new URLSearchParams()
  body.set('user.Username', username)
  body.set('user.Password', password)
  body.set('Device', 'FlowExch-Register')
  body.set('UtcOffset', String(-new Date().getTimezoneOffset()))
  if (anti) body.set('__RequestVerificationToken', anti)

  const formRes = await bpexchFetch(session, '/Users/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_ORIGIN,
      Referer: `${BPEXCH_ORIGIN}/Users/Login`,
    },
    accept: 'text/html',
    body: body.toString(),
  })
  if (formRes.status === 403) {
    throw proxyBlockedError('BPEXCH blocked the agent login request (403).')
  }

  const loc = formRes.headers.get('location') || ''
  if (formRes.status >= 300 && formRes.status < 400 && /login/i.test(loc)) {
    throw new Error('BPEXCH agent login failed (invalid credentials)')
  }

  const apiRes = await bpexchFetch(session, '/api/Users/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, identity: 'FlowExch-Register' }),
  })
  const data = await apiRes.json().catch(() => ({}))
  if (apiRes.status === 403) {
    throw proxyBlockedError('BPEXCH blocked the agent API login request (403).')
  }
  if (!apiRes.ok) {
    throw new Error(data.error || data.message || 'BPEXCH agent API login failed')
  }

  session.authToken =
    data.token || data.accessToken || data.authToken || data.wex3authtoken || ''
  session.agentType = data.type ?? data.userType ?? data.UserType
  session.agentId = data.id
  if (session.authToken) {
    session.cookies = session.cookies
      ? `${session.cookies}; wex3authtoken=${session.authToken}`
      : `wex3authtoken=${session.authToken}`
  }

  return data
}

function isCreateSuccess(status, location = '', text = '') {
  const loc = String(location)
  if (status >= 300 && status < 400) {
    if (/login/i.test(loc)) return false
    if (/\/Users\/Create/i.test(loc)) return false
    return /Accounts\/Chart|Users\/Edit|Accounts\/Cash/i.test(loc)
  }
  if (status >= 200 && status < 300) {
    if (extractError(text)) {
      return false
    }
    if (/Accounts\/Chart|successfully|created/i.test(text) || /Accounts\/Chart/i.test(loc)) {
      return true
    }
  }
  return false
}

function extractError(text = '') {
  const fromJson = text.match(/"error"\s*:\s*"([^"]+)"/i)?.[1]
  if (fromJson) return fromJson.trim()
  const fromClass =
    text.match(/class="[^"]*(?:validation|field)-?error[^"]*"[^>]*>([^<]+)/i)?.[1] ||
    text.match(/class="[^"]*text-danger[^"]*"[^>]*>([^<]+)/i)?.[1] ||
    text.match(/class="[^"]*alert-danger[^"]*"[^>]*>([^<]+)/i)?.[1]
  if (fromClass) return fromClass.trim()
  if (/already\s*exist|username.*(taken|exist)/i.test(text)) {
    return 'Username already exists on BPEXCH'
  }
  return ''
}

/**
 * @returns {{ ok: true, remote: boolean, path: string }}
 */
export async function createBpexchBettorAccount({
  username,
  password,
  phone = '',
  name = '',
  reference = 'flowexch',
}) {
  const { username: agentUser, password: agentPass } = agentCredentials()
  if (!agentUser || !agentPass) {
    const err = new Error(
      'Self-register is not configured. Ask admin to set BPEXCH_AGENT_USERNAME / BPEXCH_AGENT_PASSWORD (Master account).'
    )
    err.code = 'NOT_CONFIGURED'
    throw err
  }

  const session = { cookies: '', authToken: '', agentType: null, agentId: null }
  const agent = await loginAgent(session)

  /* Bettor (type 4) cannot create downline users. Master=2, Admin=3, SuperMaster=1 */
  if (String(agent.type ?? session.agentType) === '4') {
    const err = new Error(
      'Agent account is a Bettor and cannot create users. Set BPEXCH_AGENT_* to a Master/Admin account.'
    )
    err.code = 'AGENT_NO_PERMISSION'
    throw err
  }

  const createPage = await bpexchFetch(session, '/Users/Create', { accept: 'text/html' })
  if (createPage.status === 403) {
    throw proxyBlockedError('BPEXCH blocked the Create User page (403).')
  }
  if (createPage.status >= 300 && createPage.status < 400) {
    const loc = createPage.headers.get('location') || ''
    if (/login/i.test(loc)) {
      const err = new Error('Agent session expired — could not open Create User page')
      err.code = 'CREATE_FAILED'
      throw err
    }
  }

  const createHtml = createPage.status === 200 ? await createPage.text() : ''
  if (createHtml && !/name="user\.Username"/i.test(createHtml)) {
    const err = new Error(
      'Create User page not available for this agent. Check Master permissions on BPEXCH.'
    )
    err.code = 'AGENT_NO_PERMISSION'
    throw err
  }

  await assertUsernameAvailable(session, username)

  const anti = extractAntiForgery(createHtml)
  const notes = name ? `FlowExch self-register: ${name}` : 'FlowExch self-register'
  const form = new URLSearchParams()
  form.set('user.Username', username)
  form.set('user.Password', password)
  form.set('user.Type', '4') /* Bettor */
  form.set('user.IsActive', 'true')
  form.set('user.Phone', phone)
  form.set('user.Reference', reference || 'flowexch')
  form.set('user.Notes', notes)
  if (anti) form.set('__RequestVerificationToken', anti)

  const res = await bpexchFetch(session, '/Users/Create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_ORIGIN,
      Referer: `${BPEXCH_ORIGIN}/Users/Create`,
    },
    accept: 'text/html',
    body: form.toString(),
  })

  const location = res.headers.get('location') || ''
  const text = res.status === 200 ? await res.text() : ''

  if (isCreateSuccess(res.status, location, text)) {
    if (session.clientUsernames instanceof Set) {
      session.clientUsernames.add(String(username).trim().toLowerCase())
    }
    return { ok: true, remote: true, path: '/Users/Create', location }
  }

  const msg =
    extractError(text) ||
    (res.status === 403
      ? proxyBlockedError().message
      : null) ||
    (res.status === 405
      ? 'Method not allowed'
      : /login/i.test(location)
        ? 'Agent session expired or no create permission'
        : `Could not create account on BPEXCH (${res.status})`)

  const err = new Error(msg)
  err.code =
    /already exists on bpexch/i.test(msg)
      ? 'USERNAME_EXISTS'
      : res.status === 403
        ? 'BPEXCH_PROXY_REQUIRED'
        : 'CREATE_FAILED'
  throw err
}

export function hasAgentCredentials() {
  return getBpexchAgentConfig().configured
}
