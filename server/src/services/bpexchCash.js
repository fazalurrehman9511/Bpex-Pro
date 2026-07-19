/**
 * Deposit / withdraw cash on BPEXCH via agent Hawala (Cash) forms.
 * Used when super-admin approves a FlowExch deposit or withdraw request.
 *
 * Credentials: Super Admin DB config (bpexch_agent_config), fallback .env
 *   BPEXCH_AGENT_USERNAME / BPEXCH_AGENT_PASSWORD
 */

import { getBpexchAgentConfig } from '../db.js'

const BPEXCH_ORIGIN = process.env.BPEXCH_BASE_URL || 'https://bpexch.xyz'

function agentCredentials() {
  const cfg = getBpexchAgentConfig()
  return { username: cfg.username, password: cfg.password }
}

export function isBpexchCashConfigured() {
  return getBpexchAgentConfig().configured
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
    Accept: options.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...(options.headers || {}),
  }
  if (session.cookies) headers.Cookie = session.cookies
  if (session.authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.authToken}`
  }

  const res = await fetch(`${BPEXCH_ORIGIN}${pathName}`, {
    ...options,
    headers,
    redirect: 'manual',
  })
  session.cookies = parseCookieJar(session.cookies, res)
  return res
}

function extractAntiForgery(html = '') {
  const match = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/,
  )
  return match?.[1] || match?.[2] || ''
}

async function loginAgent(session) {
  const { username, password } = agentCredentials()
  if (!username || !password) {
    throw new Error('BPEXCH agent credentials are not configured')
  }

  /* Form/session login (needed for Clients List + Cash HTML pages) */
  const loginPage = await bpexchFetch(session, '/Users/Login', {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  })
  const html = await loginPage.text()
  const anti = extractAntiForgery(html)
  const body = new URLSearchParams()
  body.set('user.Username', username)
  body.set('user.Password', password)
  body.set('Device', 'BpxPro-Server')
  body.set('UtcOffset', String(-new Date().getTimezoneOffset()))
  if (anti) body.set('__RequestVerificationToken', anti)

  const formRes = await bpexchFetch(session, '/Users/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_ORIGIN,
      Referer: `${BPEXCH_ORIGIN}/Users/Login`,
    },
    accept: 'text/html,application/xhtml+xml',
    body: body.toString(),
  })

  const loc = formRes.headers.get('location') || ''
  const formOk =
    (formRes.status >= 300 && formRes.status < 400 && !/login/i.test(loc)) ||
    formRes.status === 200

  /* API token — many hosts block HTML login (403) but allow JSON auth */
  const apiRes = await bpexchFetch(session, '/api/Users/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    accept: 'application/json',
    body: JSON.stringify({ username, password, identity: 'BpxPro-Server' }),
  })
  const data = await apiRes.json().catch(() => ({}))
  if (apiRes.ok) {
    session.authToken =
      data.token || data.accessToken || data.authToken || data.wex3authtoken || ''
    if (session.authToken) {
      session.cookies = session.cookies
        ? `${session.cookies}; wex3authtoken=${session.authToken}`
        : `wex3authtoken=${session.authToken}`
    }
    return data
  }

  if (!formOk) {
    const hint =
      formRes.status === 403
        ? ' — hosting IP blocked / wrong password / WAF. Password dobara Save karo; warna host se bpexch.xyz allowlist poocho.'
        : ''
    throw new Error(
      data.error ||
        data.message ||
        `BPEXCH agent login failed (${formRes.status || apiRes.status})${hint}`,
    )
  }

  return data
}

/**
 * Find numeric BPEXCH client id from Clients List by username.
 */
export async function findBpexchUserIdByUsername(username) {
  const target = String(username || '').trim().toLowerCase()
  if (!target) throw new Error('BPEXCH username is required')

  const session = { cookies: '' }
  await loginAgent(session)
  const res = await bpexchFetch(session, '/Users')
  const html = await res.text()
  if (!/Clients List/i.test(html) && res.status !== 200) {
    throw new Error('Could not open BPEXCH clients list')
  }

  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || []
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    // Typical: [id, username, True/False, actions...]
    if (cells.length >= 2 && cells[1].toLowerCase() === target) {
      const id = cells[0].match(/^\d+$/)?.[0]
      if (id) return { session, userId: id, username: cells[1] }
    }
    if (new RegExp(`>${target}<`, 'i').test(row.replace(/\s+/g, ' '))) {
      const cash = row.match(/Accounts\/Cash\?id=(\d+)/i)
      if (cash?.[1]) return { session, userId: cash[1], username: target }
    }
  }

  throw new Error(`BPEXCH user not found under this agent: ${username}`)
}

async function postCashForm({ session, userId, username, amount, mode, description }) {
  const pathName = `/Accounts/Cash?id=${userId}`
  const page = await bpexchFetch(session, pathName)
  const html = await page.text()
  if (page.status !== 200 || !/Hawala \(Cash\)|Deposit Cash/i.test(html)) {
    throw new Error('BPEXCH Cash (Hawala) page not available for this user')
  }

  const depositForm = (html.match(/Deposit Cash[\s\S]*?<\/form>/i) || [])[0] || ''
  const withdrawForm = (html.match(/Withdraw cash[\s\S]*?<\/form>/i) || [])[0] || ''
  const form = mode === 'withdraw' ? withdrawForm : depositForm
  const token = extractAntiForgery(form) || extractAntiForgery(html)
  if (!token) throw new Error('BPEXCH antiforgery token missing on Cash form')

  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) throw new Error('Invalid amount for BPEXCH cash transfer')

  const body = new URLSearchParams()
  body.set('__RequestVerificationToken', token)
  body.set('DId', 'flowexch-server')
  body.set(
    'IssueDescription',
    description ||
      (mode === 'withdraw'
        ? `Cash withdrawn from ${username} (FlowExch)`
        : `Cash deposit in ${username} (FlowExch)`),
  )
  if (mode === 'withdraw') body.set('DebitAmount', String(amt))
  else body.set('CreditAmount', String(amt))

  const res = await bpexchFetch(session, pathName, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_ORIGIN,
      Referer: `${BPEXCH_ORIGIN}${pathName}`,
    },
    body,
  })

  const loc = res.headers.get('location') || ''
  if (res.status === 302 && /Ledger/i.test(loc)) {
    return { ok: true, redirect: loc, userId, amount: amt, mode }
  }

  const out = await res.text()
  if (/validation-summary-errors|field-validation-error|alert-danger/i.test(out)) {
    const errText = out
      .match(/validation-summary-errors[\s\S]*?<li[^>]*>([\s\S]*?)<\/li>/i)?.[1]
      ?.replace(/<[^>]+>/g, '')
      ?.trim()
    throw new Error(errText || 'BPEXCH rejected the cash transfer')
  }

  // Some successes may 200 back to page
  if (res.status === 200 && /Ledger|success/i.test(out)) {
    return { ok: true, redirect: null, userId, amount: amt, mode }
  }

  throw new Error(`BPEXCH cash ${mode} failed (${res.status})`)
}

function parseRsAmount(raw = '') {
  const m = String(raw)
    .replace(/,/g, '')
    .match(/(-?\d+(?:\.\d+)?)/)
  return m ? Number(m[1]) : null
}

/** Parse Credit / Balance / Max Withdraw from Hawala Cash page HTML. */
export function parseCashBalances(html = '') {
  const block = html.match(
    /Credit[\s\S]*?Balance[\s\S]*?Max\s*Width?draw[\s\S]*?<tr[^>]*>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<th[^>]*>([\s\S]*?)<\/th>/i,
  )
  if (!block) return null
  return {
    credit: parseRsAmount(block[1].replace(/<[^>]+>/g, '')),
    balance: parseRsAmount(block[2].replace(/<[^>]+>/g, '')),
    maxWithdraw: parseRsAmount(block[3].replace(/<[^>]+>/g, '')),
  }
}

async function listClientsFromSession(session) {
  const res = await bpexchFetch(session, '/Users')
  const html = await res.text()
  if (!/Clients List/i.test(html) && res.status !== 200) {
    throw new Error('Could not open BPEXCH clients list')
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
  return clients
}

/** Login as agent and return all downline clients from BPEXCH Clients List. */
export async function listAllBpexchClients() {
  const session = { cookies: '' }
  await loginAgent(session)
  return listClientsFromSession(session)
}

async function fetchCashPageBalances(session, userId) {
  const pathName = `/Accounts/Cash?id=${userId}`
  const page = await bpexchFetch(session, pathName)
  const html = await page.text()
  if (page.status !== 200) {
    throw new Error(`BPEXCH Cash page failed (${page.status})`)
  }
  const parsed = parseCashBalances(html)
  if (!parsed || parsed.balance == null) {
    throw new Error('Could not parse BPEXCH balance')
  }
  return { userId, ...parsed }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  const n = Math.min(limit, items.length) || 1
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

/** Live balance for one BPEXCH username under the configured agent. */
export async function getBpexchUserBalance(username) {
  const { session, userId, username: resolved } = await findBpexchUserIdByUsername(username)
  const cash = await fetchCashPageBalances(session, userId)
  return {
    username: resolved,
    userId,
    credit: cash.credit ?? 0,
    balance: cash.balance ?? 0,
    maxWithdraw: cash.maxWithdraw ?? cash.balance ?? 0,
  }
}

/**
 * Fetch balances for many usernames (one agent login + shared clients list).
 * Returns Map usernameLower -> { username, userId, credit, balance, maxWithdraw, error? }
 */
export async function getBpexchBalancesForUsernames(usernames = [], { concurrency = 8 } = {}) {
  const targets = [
    ...new Set(
      usernames.map((u) => String(u || '').trim()).filter(Boolean),
    ),
  ]
  const out = new Map()
  if (!targets.length) return out

  const session = { cookies: '' }
  await loginAgent(session)
  const clients = await listClientsFromSession(session)
  const byName = new Map(clients.map((c) => [c.username.toLowerCase(), c]))

  const jobs = targets.map((name) => {
    const hit = byName.get(name.toLowerCase())
    return { username: name, userId: hit?.userId || null }
  })

  await mapLimit(jobs, concurrency, async (job) => {
    if (!job.userId) {
      out.set(job.username.toLowerCase(), {
        username: job.username,
        userId: null,
        credit: null,
        balance: null,
        maxWithdraw: null,
        error: 'User not found under this agent',
      })
      return
    }
    try {
      const cash = await fetchCashPageBalances(session, job.userId)
      out.set(job.username.toLowerCase(), {
        username: job.username,
        userId: job.userId,
        credit: cash.credit ?? 0,
        balance: cash.balance ?? 0,
        maxWithdraw: cash.maxWithdraw ?? cash.balance ?? 0,
      })
    } catch (err) {
      out.set(job.username.toLowerCase(), {
        username: job.username,
        userId: job.userId,
        credit: null,
        balance: null,
        maxWithdraw: null,
        error: err.message || 'Balance fetch failed',
      })
    }
  })

  return out
}

/** Deposit cash into downline BPEXCH user (Hawala Cash CreditAmount). */
export async function depositCashToBpexchUser({ username, amount, description }) {
  const { session, userId, username: resolved } = await findBpexchUserIdByUsername(username)
  const result = await postCashForm({
    session,
    userId,
    username: resolved,
    amount,
    mode: 'deposit',
    description,
  })
  try {
    const cash = await fetchCashPageBalances(session, userId)
    result.balance = cash.balance
    result.credit = cash.credit
    result.maxWithdraw = cash.maxWithdraw
  } catch {
    /* optional */
  }
  return result
}

/** Withdraw cash from downline BPEXCH user (Hawala Cash DebitAmount). */
export async function withdrawCashFromBpexchUser({ username, amount, description }) {
  const { session, userId, username: resolved } = await findBpexchUserIdByUsername(username)
  const result = await postCashForm({
    session,
    userId,
    username: resolved,
    amount,
    mode: 'withdraw',
    description,
  })
  try {
    const cash = await fetchCashPageBalances(session, userId)
    result.balance = cash.balance
    result.credit = cash.credit
    result.maxWithdraw = cash.maxWithdraw
  } catch {
    /* optional */
  }
  return result
}

/** Withdrawals blocked when BPEXCH balance is 0–500 inclusive. */
export const MIN_BALANCE_FOR_WITHDRAW = 500
