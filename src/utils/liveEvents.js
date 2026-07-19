const API_BASE = import.meta.env.VITE_API_URL || ''

function formatSize(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`
  return String(Math.round(v))
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

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
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
      backs.push({ price: String(b.price ?? '—'), size: formatSize(b.size ?? b.amount) })
    }
    for (const l of al.slice(0, 3)) {
      lays.push({ price: String(l.price ?? '—'), size: formatSize(l.size ?? l.amount) })
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
  const marketId = String(raw.marketId || raw.MarketId || raw.id || '')
  const event = raw.event || raw.Event || {}
  const eventType = raw.eventType || raw.EventType || {}
  const competition = raw.competition || raw.Competition || {}

  const marketName = raw.marketName || raw.MarketName || 'Match Odds'
  const eventName = event.name || event.Name || raw.eventName || raw.EventName || ''
  const typeName =
    eventType.name || eventType.Name || raw.sport || raw.Sport || raw.eventTypeName || ''

  const runners = raw.runners || raw.Runners || []
  const runnerNames = runners
    .map((r) => r.runnerName || r.RunnerName || r.name)
    .filter(Boolean)

  let teams = String(eventName || '').trim()
  if (!teams && runnerNames.length >= 2) {
    teams = runnerNames.filter((n) => !/draw/i.test(n)).slice(0, 2).join(' v ')
  }
  if (!teams) teams = String(marketName)

  const filter = sportFilter(`${typeName} ${teams} ${competition.name || ''}`)
  const statusRaw = String(raw.status || raw.Status || '').toUpperCase()
  const inPlay = !!(
    raw.inPlay ??
    raw.InPlay ??
    raw.isInPlay ??
    /IN.?PLAY|INPLAY/.test(statusRaw)
  )
  const matched = Number(
    raw.totalMatched ?? raw.TotalMatched ?? raw.amount ?? raw.Amount ?? raw.matched ?? 0
  )
  const start =
    raw.marketStartTime || raw.MarketStartTime || event.openDate || raw.startTime || null

  const hasOdds = runners.some(
    (r) =>
      r.ex?.availableToBack?.length ||
      r.ex?.availableToLay?.length ||
      r.availableToBack?.length ||
      r.availableToLay?.length
  )
  const ladder = hasOdds ? ladderFromRunners(runners) : matchedLadder(matched)

  return {
    id: marketId || teams,
    sport: sportLabel(filter),
    teams,
    status: inPlay ? 'IN PLAY' : statusRaw === 'SUSPENDED' ? 'SUSPENDED' : 'OPEN',
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
  }
}

export async function fetchLiveEvents() {
  const res = await fetch(`${API_BASE}/api/live-events`, {
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  /* Never surface raw API/session errors to the UI — return empty payload */
  if (!res.ok) {
    return {
      events: Array.isArray(data.events) ? data.events : [],
      error: null,
      updatedAt: data.updatedAt || Date.now(),
      source: data.source || 'none',
    }
  }
  return {
    ...data,
    events: Array.isArray(data.events) ? data.events : [],
    error: null,
  }
}

/**
 * If user is logged into embedded BPEXCH on this origin, reuse that session
 * for the same Sport Highlights markets shown on bpexch.xyz.
 */
export async function fetchSessionMarkets() {
  try {
    const res = await fetch('/bpexch/api/Markets/', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const payload = await res.json()
    if (payload?.error) return null
    const list = Array.isArray(payload) ? payload : payload.markets || payload.Markets || []
    if (!list.length) return null
    const events = list.map(normalizeMarket)
    events.sort((a, b) => {
      const rank = (e) =>
        (e.status === 'IN PLAY' ? 100 : 0) +
        (['cricket', 'soccer', 'tennis'].includes(e.filter) ? 10 : 0) +
        Math.min(e.matched / 1e6, 50)
      return rank(b) - rank(a)
    })
    return { events: events.slice(0, 24), source: 'session' }
  } catch {
    return null
  }
}
