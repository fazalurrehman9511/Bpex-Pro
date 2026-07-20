import { useEffect, useState } from 'react'
import { fetchLiveEvents, fetchSessionMarkets } from '../utils/liveEvents'

const FALLBACK = [
  '💰 Instant JazzCash & EasyPaisa Deposits',
  '🌍 Agents in PK · UAE · SA · UK · BD · IN',
  '📱 Install BpxPro App — Add to Home Screen',
]

function toTickerItems(events = []) {
  const live = events.slice(0, 8).map((e) => {
    if (e.status === 'IN PLAY') return `🔴 LIVE — ${e.teams} — ${e.market}`
    if (e.matchedLabel && e.matchedLabel !== '—') {
      return `⚡ ${e.teams} — Traded ${e.matchedLabel}`
    }
    return `📢 ${e.sport} — ${e.teams} — ${e.status}`
  })
  return live.length ? [...live, ...FALLBACK] : FALLBACK
}

export default function MarqueeTicker() {
  const [items, setItems] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false

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

    load()
    const timer = window.setInterval(load, 30000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden border-b border-accent/20 bg-navy-dark">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="mx-6 text-xs font-medium text-muted">
            {item}
            <span className="mx-6 text-accent/40">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
