#!/usr/bin/env node
/**
 * Run on your laptop/PC (where Cloudflare allows bpexch.xyz).
 * Fetches agent Clients List from BPEXCH, then imports into bpexpro.com admin API.
 *
 * Usage:
 *   node scripts/sync-bpexch-from-pc.mjs
 *
 * Env (optional — otherwise prompts via args):
 *   API_BASE=https://bpexpro.com
 *   ADMIN_USER=superadmin
 *   ADMIN_PASS=...
 *   BPEXCH_USER=7854107
 *   BPEXCH_PASS=...
 *   BPEXCH_BASE=https://bpexch.xyz
 */

const API_BASE = (process.env.API_BASE || 'https://bpexpro.com').replace(/\/$/, '')
const BPEXCH_BASE = (process.env.BPEXCH_BASE || 'https://bpexch.xyz').replace(/\/$/, '')

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

const ADMIN_USER = arg('admin-user', process.env.ADMIN_USER || 'superadmin')
const ADMIN_PASS = arg('admin-pass', process.env.ADMIN_PASS || '')
const BPEXCH_USER = arg('bpexch-user', process.env.BPEXCH_USER || '')
const BPEXCH_PASS = arg('bpexch-pass', process.env.BPEXCH_PASS || '')

if (!ADMIN_PASS || !BPEXCH_USER || !BPEXCH_PASS) {
  console.error(`Missing credentials.

Example:
  ADMIN_PASS='your-admin-pass' BPEXCH_USER='7854107' BPEXCH_PASS='agent-pass' \\
    node scripts/sync-bpexch-from-pc.mjs

Or:
  node scripts/sync-bpexch-from-pc.mjs \\
    --admin-pass '...' --bpexch-user '7854107' --bpexch-pass '...'
`)
  process.exit(1)
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

function extractAntiForgery(html = '') {
  const match = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/,
  )
  return match?.[1] || match?.[2] || ''
}

async function bpexchFetch(session, pathName, options = {}) {
  const headers = {
    Accept: options.accept || 'text/html,application/xhtml+xml,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...(options.headers || {}),
  }
  if (session.cookies) headers.Cookie = session.cookies
  if (session.authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.authToken}`
  }
  const res = await fetch(`${BPEXCH_BASE}${pathName}`, {
    ...options,
    headers,
    redirect: 'manual',
  })
  session.cookies = parseCookieJar(session.cookies, res)
  return res
}

async function loginBpexch(session) {
  const loginPage = await bpexchFetch(session, '/Users/Login', { accept: 'text/html' })
  if (loginPage.status === 403) {
    throw new Error('Cloudflare blocked this PC too (403). VPN off karke try karo / ghar ke network pe.')
  }
  const html = await loginPage.text()
  const anti = extractAntiForgery(html)
  const body = new URLSearchParams()
  body.set('user.Username', BPEXCH_USER)
  body.set('user.Password', BPEXCH_PASS)
  body.set('Device', 'BpxPro-PC-Sync')
  body.set('UtcOffset', String(-new Date().getTimezoneOffset()))
  if (anti) body.set('__RequestVerificationToken', anti)

  await bpexchFetch(session, '/Users/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_BASE,
      Referer: `${BPEXCH_BASE}/Users/Login`,
    },
    accept: 'text/html',
    body: body.toString(),
  })

  const apiRes = await bpexchFetch(session, '/api/Users/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    accept: 'application/json',
    body: JSON.stringify({
      username: BPEXCH_USER,
      password: BPEXCH_PASS,
      identity: 'BpxPro-PC-Sync',
    }),
  })
  const data = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok) {
    throw new Error(data.error || data.message || `BPEXCH API login failed (${apiRes.status})`)
  }
  session.authToken =
    data.token || data.accessToken || data.authToken || data.wex3authtoken || ''
  if (session.authToken) {
    session.cookies = session.cookies
      ? `${session.cookies}; wex3authtoken=${session.authToken}`
      : `wex3authtoken=${session.authToken}`
  }
  console.log('✓ BPEXCH login OK as', BPEXCH_USER)
}

async function listClients(session) {
  const res = await bpexchFetch(session, '/Users')
  const html = await res.text()
  if (res.status === 403 || /Just a moment/i.test(html)) {
    throw new Error('Cloudflare challenge on /Users — browser se bpexch.xyz open karke challenge clear karo, phir script dubara.')
  }
  if (!/Clients List/i.test(html) && res.status !== 200) {
    throw new Error(`Could not open Clients List (HTTP ${res.status})`)
  }

  const clients = []
  const seen = new Set()
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || []
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    const cashId = row.match(/Accounts\/Cash\?id=(\d+)/i)?.[1]
    const editId = row.match(/Users\/Edit\?id=(\d+)/i)?.[1]
    const id = cashId || editId || (cells[0]?.match(/^\d+$/) ? cells[0] : null)
    const name = cells.length >= 2 ? cells[1] : ''
    if (!id || !name || /^id$/i.test(name) || /^name$/i.test(name)) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const activeRaw = (cells[2] || '').toLowerCase()
    const isActive = activeRaw === 'true' || activeRaw === 'yes' || activeRaw === '1'
    clients.push({
      userId: String(id),
      username: name,
      isActive: activeRaw ? isActive : true,
    })
  }
  console.log(`✓ Fetched ${clients.length} clients from BPEXCH`)
  return clients
}

async function adminLogin() {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Admin login failed (${res.status})`)
  console.log('✓ Admin login OK →', API_BASE)
  return data.token
}

async function importClients(token, clients) {
  const res = await fetch(`${API_BASE}/api/bpexch/users/import-clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      agentUsername: BPEXCH_USER,
      clients,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`)
  return data
}

async function main() {
  console.log('API:', API_BASE)
  console.log('BPEXCH:', BPEXCH_BASE)

  const session = { cookies: '' }
  await loginBpexch(session)
  const clients = await listClients(session)
  if (!clients.length) {
    console.warn('No clients found — agent ke under Clients List empty to hai?')
  }

  const token = await adminLogin()
  const result = await importClients(token, clients)
  console.log('✓ Import done:', {
    fetched: result.fetched,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    agent: result.agentUsername,
  })
  console.log('Ab admin → BPEXCH Users refresh karo.')
}

main().catch((err) => {
  console.error('✗', err.message || err)
  process.exit(1)
})
