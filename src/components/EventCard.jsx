export default function EventCard({ sport, teams, status, time, competition }) {
  const isLive = status === 'OPEN' || status === 'IN PLAY'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">{sport}</p>
            {time ? <span className="text-[10px] text-slate-400">{time}</span> : null}
          </div>
          <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900">{teams}</h3>
          {competition ? (
            <p className="truncate text-[10px] text-slate-500">{competition}</p>
          ) : null}
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
          {status}
        </span>
      </div>
    </div>
  )
}
