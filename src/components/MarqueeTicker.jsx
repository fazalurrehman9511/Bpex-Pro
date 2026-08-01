import { useEffect, useState } from 'react'
import { fetchLiveEvents, fetchSessionMarkets } from '../utils/liveEvents'

const FALLBACK = [
  'Instant JazzCash & EasyPaisa Deposits',
  'Agents in PK · UAE · SA · UK · BD · IN',
  'Register with Agent or Create Myself — 60 seconds',
]

function toTickerItems(events = []) {
  const live = events.slice(0, 8).map((e) => {
    if (e.status === 'IN PLAY') return `LIVE — ${e.teams} — ${e.market}`
    if (e.matchedLabel && e.matchedLabel !== '—') {
      return `${e.teams} — Traded ${e.matchedLabel}`
    }
    return `${e.sport} — ${e.teams} — ${e.status}`
  })
  return live.length ? [...live, ...FALLBACK] : FALLBACK
}

function runWhenIdle(fn, timeout = 4000) {
  if (typeof window === 'undefined') return () => {}
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback?.(id)
  }
  const t = window.setTimeout(fn, Math.min(timeout, 2000))
  return () => window.clearTimeout(t)
}

export default function MarqueeTicker() {
  const [items, setItems] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false
    let timer

    async function load() {
      try {
        const session = await fetchSessionMarkets()
        if (!cancelled && session?.events?.length) {
          setItems(toTickerItems(session.events))
          return
        }
        const data = await fetchLiveEvents()
        if (!cancelled) setItems(toTickerItems(data.events || []))
      } catch {
        /* keep fallback */
      }
    }

    const cancelIdle = runWhenIdle(() => {
      if (cancelled) return
      load()
      timer = window.setInterval(load, 45000)
    }, 5000)

    return () => {
      cancelled = true
      cancelIdle()
      if (timer) window.clearInterval(timer)
    }
  }, [])

  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden bg-gradient-to-r from-[#0a4d2e] via-emerald-700 to-teal-600" aria-hidden="true">
      <div className="flex animate-marquee whitespace-nowrap py-3">
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="mx-6 text-xs font-semibold text-emerald-50">
            {item}
            <span className="mx-6 text-[#25D366]">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
