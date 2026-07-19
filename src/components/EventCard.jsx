export default function EventCard({ sport, teams, status, time, competition }) {
  const isLive = status === 'OPEN' || status === 'IN PLAY'

  return (
    <div className="overflow-hidden rounded border border-slate-300 bg-navy-light shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{sport}</p>
            {time ? <span className="text-[10px] text-muted">{time}</span> : null}
          </div>
          <h3 className="mt-0.5 truncate text-sm font-bold text-text">{teams}</h3>
          {competition ? (
            <p className="truncate text-[10px] text-muted">{competition}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
            isLive ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
          {status}
        </span>
      </div>
    </div>
  )
}
