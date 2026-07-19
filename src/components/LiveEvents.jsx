import { useEffect, useMemo, useState } from 'react'
import { Radio, RefreshCw } from 'lucide-react'
import { useModal } from '../context/ModalContext'
import EventCard from './EventCard'
import { fetchLiveEvents, fetchSessionMarkets } from '../utils/liveEvents'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'soccer', label: 'Soccer' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'horse', label: 'Horse' },
  { id: 'greyhound', label: 'Greyhound' },
]

const POLL_MS = 5000
const EMPTY_MESSAGE = 'Live data is not available right now'

export default function LiveEvents() {
  const { openModal } = useModal()
  const [activeFilter, setActiveFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer

    async function load() {
      try {
        const data = await fetchLiveEvents()
        if (cancelled) return
        let next = Array.isArray(data.events) ? data.events : []

        const session = await fetchSessionMarkets()
        if (session?.events?.length) {
          const map = new Map()
          for (const e of [...session.events, ...next]) {
            map.set(e.marketId || e.id || e.teams, e)
          }
          next = [...map.values()].slice(0, 24)
        }

        setEvents(next)
        setEmpty(next.length === 0)
      } catch {
        if (!cancelled) {
          setEmpty(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    timer = window.setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return events
    return events.filter((e) => e.filter === activeFilter)
  }, [events, activeFilter])

  const openCount = filtered.filter((e) => e.status === 'OPEN' || e.status === 'IN PLAY').length
  const showEmpty = !filtered.length && (empty || !loading)

  return (
    <section id="events" className="hex-pattern px-4 py-6 pb-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent" />
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">Live Events</h2>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            <span className="rounded bg-accent px-2.5 py-0.5 text-[10px] font-bold text-navy-dark">
              {openCount} OPEN
            </span>
          </div>
        </div>

        <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveFilter(id)}
              className={`shrink-0 rounded px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeFilter === id
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && !filtered.length ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-600">Loading live markets…</p>
          </div>
        ) : showEmpty ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">{EMPTY_MESSAGE}</p>
            <p className="mt-1 text-xs text-slate-500">Please check back in a few minutes</p>
          </div>
        ) : (
          <div className="max-h-[calc(8*4.75rem+7*0.75rem)] overflow-y-auto overscroll-contain pr-1 sm:max-h-[calc(6*4.75rem+5*0.75rem)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((event) => (
                <button
                  key={event.id || event.teams}
                  type="button"
                  onClick={() => openModal('register')}
                  className="text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <EventCard
                    sport={event.sport}
                    teams={event.teams}
                    status={event.status}
                    time={event.time}
                    competition={event.competition}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          Tap any event to register and start betting via WhatsApp
        </p>
      </div>
    </section>
  )
}
