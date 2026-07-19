import { Users, Clock, Globe, Headphones } from 'lucide-react'

const stats = [
  { icon: Users, value: '15,000+', label: 'Active Users' },
  { icon: Clock, value: '5 Min', label: 'Avg Payout' },
  { icon: Globe, value: '6', label: 'Countries' },
  { icon: Headphones, value: '24/7', label: 'WhatsApp Support' },
]

export default function StatsBar() {
  return (
    <section className="border-y border-border/50 bg-navy-dark px-4 py-5 sm:px-6">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded border border-border/60 bg-navy-light/50 px-3 py-3 sm:px-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent/10">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-base font-extrabold text-text leading-none sm:text-lg">{value}</p>
              <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
