/**
 * Server-side BPEXCH live feed for the PUBLIC homepage.
 * Visitors do NOT need to log in — the server keeps a BPEXCH session and
 * refreshes markets on a timer for everyone.
 *
 * Set in server/.env:
 *   BPEXCH_LIVE_USERNAME=...
 *   BPEXCH_LIVE_PASSWORD=...
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { bpexchHttpFetch } from './bpexchHttp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSION_FILE = path.resolve(__dirname, '../../data/bpexch-live-session.json')

const BPEXCH_ORIGIN = process.env.BPEXCH_BASE_URL || 'https://bpexch.xyz'
const POLL_MS = Number(process.env.BPEXCH_LIVE_POLL_MS) || 8000
const CACHE_TTL_MS = 12_000
const MAX_LIVE_EVENTS = Number(process.env.BPEXCH_LIVE_MAX_EVENTS) || 120
/** Re-login before BPEXCH kills the session (~20–30 min). */
const SESSION_MAX_AGE_MS = Number(process.env.BPEXCH_LIVE_SESSION_MS) || 15 * 60 * 1000

let cache = {
  events: [],
  updatedAt: 0,
  source: 'none',
  error: null,
  public: true,
}

let cookies = ''
let authToken = ''
let lastLoginAt = 0
let pollTimer = null
let inflight = null

function hasLiveCredentials() {
  return !!(process.env.BPEXCH_LIVE_USERNAME && process.env.BPEXCH_LIVE_PASSWORD)
}

function sportFilter(name = '') {
  const n = String(name).toLowerCase()
  if (/cricket|t20|odi|test/.test(n)) return 'cricket'
  if (/soccer|football|fifa/.test(n)) return 'soccer'
  if (/tennis/.test(n)) return 'tennis'
  if (/horse|racing|thoroughbred|harness/.test(n)) return 'horse'
  if (/grey|hound|dog/.test(n)) return 'greyhound'
  return 'other'
}

function sportLabel(filter) {
  return (
    {
      cricket: 'Cricket',
      soccer: 'Soccer',
      tennis: 'Tennis',
      horse: 'Horse Race',
      greyhound: 'Greyhound',
      other: 'Sports',
    }[filter] || 'Sports'
  )
}

function formatSize(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`
  return String(Math.round(v))
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
  if (isTomorrow) return `Tomorrow ${time}`
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ladderFromRunners(runners = []) {
  const backs = []
  const lays = []
  for (const r of runners) {
    const ex = r.ex || r.exchange || r
    const ab = ex.availableToBack || r.availableToBack || []
    const al = ex.availableToLay || r.availableToLay || []
    for (const b of ab.slice(0, 3)) {
      backs.push({
        price: String(b.price ?? b.Price ?? '—'),
        size: formatSize(b.size ?? b.Size ?? b.amount),
      })
    }
    for (const l of al.slice(0, 3)) {
      lays.push({
        price: String(l.price ?? l.Price ?? '—'),
        size: formatSize(l.size ?? l.Size ?? l.amount),
      })
    }
    if (backs.length || lays.length) break
  }
  while (backs.length < 3) backs.push({ price: '—', size: '—' })
  while (lays.length < 3) lays.push({ price: '—', size: '—' })
  return { backs: backs.slice(0, 3), lays: lays.slice(0, 3) }
}

function matchedLadder(matched) {
  const size = formatSize(matched)
  return {
    backs: [
      { price: '—', size },
      { price: '—', size: '—' },
      { price: '—', size: '—' },
    ],
    lays: [
      { price: '—', size },
      { price: '—', size: '—' },
      { price: '—', size: '—' },
    ],
  }
}

export function normalizeMarket(raw = {}) {
  const marketId = String(raw.marketId || raw.MarketId || raw.id || raw.Id || '')
  const event = raw.event || raw.Event || {}
  const eventType = raw.eventType || raw.EventType || {}
  const competition = raw.competition || raw.Competition || {}

  const marketName = raw.marketName || raw.MarketName || 'Match Odds'
  const eventName =
    event.name ||
    event.Name ||
    raw.eventName ||
    raw.EventName ||
    ''
  const typeName =
    eventType.name ||
    eventType.Name ||
    raw.sport ||
    raw.Sport ||
    raw.eventTypeName ||
    raw.EventTypeName ||
    ''

  const runners = raw.runners || raw.Runners || raw.selections || []
  const runnerNames = runners
    .map((r) => r.runnerName || r.RunnerName || r.name)
    .filter(Boolean)

  /* Team line: "Norway v England" — NOT marketName ("Match Odds") */
  let teams = String(eventName || '').trim()
  if (!teams && runnerNames.length >= 2) {
    teams = runnerNames.filter((n) => !/draw/i.test(n)).slice(0, 2).join(' v ')
  }
  if (!teams) teams = String(marketName)

  const filter = sportFilter(`${typeName} ${teams} ${competition.name || ''}`)
  const statusRaw = String(raw.status || raw.Status || event.status || '').toUpperCase()
  const inPlay = !!(
    (raw.inPlay ?? raw.InPlay ?? raw.isInPlay) ||
    /IN.?PLAY|INPLAY/.test(statusRaw) ||
    statusRaw === 'INPLAY'
  )
  const matched = Number(
    raw.totalMatched ?? raw.TotalMatched ?? raw.amount ?? raw.Amount ?? raw.matched ?? 0
  )
  const start =
    raw.marketStartTime ||
    raw.MarketStartTime ||
    event.openDate ||
    raw.startTime ||
    raw.marketStartTimeUtc ||
    null

  const hasOdds = runners.some(
    (r) =>
      (r.ex && (r.ex.availableToBack?.length || r.ex.availableToLay?.length)) ||
      r.availableToBack?.length ||
      r.availableToLay?.length
  )
  const ladder = hasOdds ? ladderFromRunners(runners) : matchedLadder(matched)

  return {
    id: marketId || teams,
    sport: sportLabel(filter),
    teams,
    status: inPlay || statusRaw === 'INPLAY' ? 'IN PLAY' : statusRaw === 'SUSPENDED' ? 'SUSPENDED' : 'OPEN',
    market: marketName || 'Match Odds',
    competition: competition.name || competition.Name || '',
    time: inPlay ? 'Live Now' : formatTime(start),
    filter,
    matched,
    matchedLabel: formatSize(matched),
    hasOdds,
    runners: runnerNames,
    backs: ladder.backs,
    lays: ladder.lays,
    marketId,
    link: marketId ? `/bpexch/Markets/#!${marketId}` : '/dashboard',
  }
}

function loadSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return
    const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'))
    cookies = data.cookies || ''
    authToken = data.authToken || ''
    lastLoginAt = data.lastLoginAt || 0
  } catch {
    /* ignore */
  }
}

function saveSession() {
  try {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true })
    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify({ cookies, authToken, lastLoginAt, savedAt: Date.now() }, null, 2)
    )
  } catch (err) {
    console.warn('[live-events] Could not save session:', err.message)
  }
}

function parseCookieJar(res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const list = raw.length ? [...raw] : []
  if (!list.length) {
    const single = res.headers.get('set-cookie')
    if (single) list.push(single)
  }
  const map = new Map()
  for (const c of cookies.split(';').map((x) => x.trim()).filter(Boolean)) {
    const i = c.indexOf('=')
    if (i > 0) map.set(c.slice(0, i), c.slice(i + 1))
  }
  for (const line of list) {
    const part = String(line).split(';')[0]
    const i = part.indexOf('=')
    if (i > 0) map.set(part.slice(0, i), part.slice(i + 1))
  }
  cookies = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function bpexchFetch(pathName, options = {}) {
  const headers = {
    Accept: options.accept || 'application/json, text/html;q=0.9,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...(options.headers || {}),
  }
  if (cookies) headers.Cookie = cookies
  if (authToken && !headers.Authorization) headers.Authorization = `Bearer ${authToken}`

  const res = await bpexchHttpFetch(`${BPEXCH_ORIGIN}${pathName}`, {
    ...options,
    headers,
    redirect: 'manual',
    requireProxy: false,
  })
  parseCookieJar(res)
  return res
}

async function loginWithForm() {
  const username = process.env.BPEXCH_LIVE_USERNAME || ''
  const password = process.env.BPEXCH_LIVE_PASSWORD || ''
  if (!username || !password) return false

  const loginPage = await bpexchFetch('/Users/Login', {
    accept: 'text/html',
  })
  const html = await loginPage.text()
  const tokenMatch = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/
  )
  const anti = tokenMatch?.[1] || tokenMatch?.[2] || ''

  const body = new URLSearchParams()
  body.set('user.Username', username)
  body.set('user.Password', password)
  body.set('Device', 'FlowExch-LiveBot')
  body.set('UtcOffset', String(-new Date().getTimezoneOffset()))
  if (anti) body.set('__RequestVerificationToken', anti)

  const res = await bpexchFetch('/Users/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BPEXCH_ORIGIN,
      Referer: `${BPEXCH_ORIGIN}/Users/Login`,
    },
    accept: 'text/html',
    body: body.toString(),
  })

  /* Success usually redirects away from Login */
  const loc = res.headers.get('location') || ''
  if (res.status >= 300 && res.status < 400 && loc && !/login/i.test(loc)) {
    lastLoginAt = Date.now()
    saveSession()
    return true
  }

  /* Some setups return 200 dashboard HTML */
  const text = res.status === 200 ? await res.text() : ''
  if (text && !/login100-form|Users\/Login/i.test(text.slice(0, 4000))) {
    lastLoginAt = Date.now()
    saveSession()
    return true
  }

  return false
}

async function loginWithApi() {
  const username = process.env.BPEXCH_LIVE_USERNAME || ''
  const password = process.env.BPEXCH_LIVE_PASSWORD || ''
  if (!username || !password) return false

  const res = await bpexchFetch('/api/Users/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      identity: 'FlowExch-LiveBot',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.message || `BPEXCH API login failed (${res.status})`)
  }
  authToken =
    data.token ||
    data.accessToken ||
    data.authToken ||
    data.wex3authtoken ||
    data.Token ||
    ''
  if (authToken && !/wex3authtoken=/.test(cookies)) {
    cookies = cookies ? `${cookies}; wex3authtoken=${authToken}` : `wex3authtoken=${authToken}`
  }
  lastLoginAt = Date.now()
  saveSession()
  return true
}

function clearSession() {
  cookies = ''
  authToken = ''
  lastLoginAt = 0
  try {
    if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE)
  } catch {
    /* ignore */
  }
}

function isSessionError(status, body = {}) {
  if (status === 401 || status === 403) return true
  const msg = String(body.error || body.message || body.Message || '').toUpperCase()
  return (
    msg.includes('INVALID_SESSION') ||
    msg.includes('MISSING_AUTH') ||
    msg.includes('UNAUTHORIZED') ||
    msg.includes('SESSION')
  )
}

async function ensureLoggedIn({ force = false } = {}) {
  if (!hasLiveCredentials()) return false
  const age = Date.now() - lastLoginAt
  const fresh = Boolean(cookies || authToken) && age > 0 && age < SESSION_MAX_AGE_MS
  if (!force && fresh) return true

  if (force || !fresh) {
    /* Drop stale cookies/token so BPEXCH accepts a clean login */
    cookies = ''
    authToken = ''
  }

  try {
    if (await loginWithForm()) {
      console.log('[live-events] Session refreshed (form login)')
      return true
    }
  } catch (err) {
    console.warn('[live-events] Form login failed:', err.message)
  }
  try {
    const ok = await loginWithApi()
    if (ok) console.log('[live-events] Session refreshed (API login)')
    return ok
  } catch (err) {
    console.warn('[live-events] API login failed:', err.message)
    return false
  }
}

async function fetchMarkets() {
  const res = await bpexchFetch('/api/Markets/', {
    accept: 'application/json',
  })
  let data = await res.json().catch(() => ({}))

  if (isSessionError(res.status, data)) {
    const ok = await ensureLoggedIn({ force: true })
    if (!ok) {
      throw new Error(data.error || data.message || 'INVALID_SESSION')
    }
    const retry = await bpexchFetch('/api/Markets/', { accept: 'application/json' })
    data = await retry.json().catch(() => ({}))
    if (!retry.ok || isSessionError(retry.status, data)) {
      clearSession()
      throw new Error(data.error || data.message || `Markets ${retry.status}`)
    }
  } else if (!res.ok) {
    throw new Error(data.error || data.message || `Markets ${res.status}`)
  }

  return Array.isArray(data) ? data : data.markets || data.Markets || []
}

function parseHighlightsHtml(html = '') {
  const events = []
  const sections = html.split(/RaceCards__main/i)

  for (const section of sections.slice(1)) {
    let currentSport = 'Horse Race'
    const sportMatch =
      section.match(/<b[^>]*class="[^"]*imghorseb[^"]*"[^>]*>\s*([^<]+)/i) ||
      section.match(/<b[^>]*>\s*((?:Horse|Grey)\s*[^<]*)</i)
    if (sportMatch) currentSport = sportMatch[1].replace(/\s+/g, ' ').trim()

    const blockRe =
      /href="\/Common\/Event\/([^"]+)"([\s\S]*?)(?=href="\/Common\/Event\/|RaceCards__|$)/gi
    let m
    while ((m = blockRe.exec(`${section}RaceCards__`))) {
      const id = m[1]
      const block = m[2] || ''
      const nameMatch =
        block.match(/slidename'?>\s*([^<]+)/i) || block.match(/slidename">\s*([^<]+)/i)
      const teams = (nameMatch?.[1] || '').replace(/\s+/g, ' ').trim()
      if (!teams) continue
      const timeMatch = block.match(/utctime[^>]*>\s*([^<]+)/i)
      const filter = sportFilter(currentSport)
      events.push({
        id: `event-${id}`,
        sport: sportLabel(filter),
        teams,
        status: 'OPEN',
        market: 'Winner',
        time: formatTime(timeMatch?.[1]?.trim()),
        filter,
        matched: 0,
        matchedLabel: '—',
        hasOdds: false,
        backs: matchedLadder(0).backs,
        lays: matchedLadder(0).lays,
        marketId: id,
        link: `/bpexch/Common/Event/${id}`,
        _normalized: true,
      })
    }
  }

  const seen = new Set()
  return events.filter((e) => {
    const k = `${e.teams}|${e.marketId}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function fetchHighlightsFallback() {
  const res = await bpexchFetch('/Common/MarketHighlights', {
    accept: 'text/html',
  })
  if (!res.ok) return []
  return parseHighlightsHtml(await res.text())
}

function rankEvent(e) {
  let s = 0
  if (e.status === 'IN PLAY') s += 100
  if (['cricket', 'soccer', 'tennis'].includes(e.filter)) s += 10
  s += Math.min((e.matched || 0) / 1e6, 50)
  return s
}

function mergeEvents(...lists) {
  const map = new Map()
  for (const list of lists) {
    for (const e of list || []) {
      const key = e.marketId || e.id || e.teams
      const prev = map.get(key)
      if (!prev || rankEvent(e) >= rankEvent(prev)) map.set(key, e)
    }
  }
  return [...map.values()].sort((a, b) => rankEvent(b) - rankEvent(a)).slice(0, MAX_LIVE_EVENTS)
}

export async function refreshLiveEvents() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const highlights = await fetchHighlightsFallback().catch(() => [])
      let markets = []
      let source = 'highlights'
      let errMsg = null

      if (hasLiveCredentials()) {
        try {
          await ensureLoggedIn()
          markets = await fetchMarkets()
          source = 'markets'
        } catch (err) {
          errMsg = err.message
          console.warn('[live-events] Markets fetch failed:', err.message)
          /* One more hard re-login if session died mid-poll */
          if (/INVALID_SESSION|UNAUTHORIZED|MISSING_AUTH|SESSION/i.test(err.message)) {
            try {
              const ok = await ensureLoggedIn({ force: true })
              if (ok) {
                markets = await fetchMarkets()
                source = 'markets'
                errMsg = null
              }
            } catch (retryErr) {
              errMsg = retryErr.message
            }
          }
        }
      } else {
        errMsg = 'Set BPEXCH_LIVE_USERNAME and BPEXCH_LIVE_PASSWORD in server/.env for full sports feed'
      }

      const normalizedMarkets = (Array.isArray(markets) ? markets : []).map(normalizeMarket)
      const events = mergeEvents(normalizedMarkets, highlights)

      cache = {
        events,
        updatedAt: Date.now(),
        source: normalizedMarkets.length ? source : 'highlights',
        error: events.length ? null : errMsg,
        public: true,
        hasCredentials: hasLiveCredentials(),
      }
      return cache
    } catch (err) {
      cache = {
        ...cache,
        error: err.message || 'Failed to load live events',
        updatedAt: cache.updatedAt || Date.now(),
        public: true,
        hasCredentials: hasLiveCredentials(),
      }
      return cache
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export async function getLiveEvents({ force = false } = {}) {
  const stale = Date.now() - cache.updatedAt > CACHE_TTL_MS
  if (force || stale || !cache.events.length) {
    await refreshLiveEvents()
  }
  return cache
}

export function normalizeMarketsPayload(payload) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.markets || payload?.Markets || []
  return list.map(normalizeMarket)
}

export function startLiveEventsPoller() {
  if (pollTimer) return
  loadSession()
  refreshLiveEvents()
    .then((data) => {
      console.log(
        `[live-events] Ready — ${data.events.length} events (source=${data.source}` +
          `${hasLiveCredentials() ? ', credentials=yes' : ', credentials=NO — public racing only'})`
      )
    })
    .catch(() => {})
  pollTimer = setInterval(() => {
    refreshLiveEvents().catch(() => {})
  }, POLL_MS)
  if (typeof pollTimer.unref === 'function') pollTimer.unref()
}
