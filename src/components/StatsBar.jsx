import { Users, Clock, Globe, Headphones } from 'lucide-react'
import { useHomepageContent } from '../context/HomepageContentContext'

const statIcons = [Users, Clock, Globe, Headphones]
const statThemes = [
  { card: 'stat-card-emerald', icon: 'bg-emerald-500', iconText: 'text-white', value: 'text-emerald-700' },
  { card: 'stat-card-sky', icon: 'bg-sky-500', iconText: 'text-white', value: 'text-sky-700' },
  { card: 'stat-card-amber', icon: 'bg-amber-500', iconText: 'text-white', value: 'text-amber-700' },
  { card: 'stat-card-violet', icon: 'bg-violet-500', iconText: 'text-white', value: 'text-violet-700' },
]

export default function StatsBar() {
  const { stats } = useHomepageContent()

  return (
    <section className="relative px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map(({ value, label }, index) => {
          const Icon = statIcons[index % statIcons.length]
          const theme = statThemes[index % statThemes.length]
          return (
            <div
              key={`${label}-${index}`}
              className={`colorful-stat ${theme.card} flex items-center gap-3 p-4 sm:p-5`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${theme.icon}`}>
                <Icon className={`h-5 w-5 ${theme.iconText}`} />
              </div>
              <div>
                <p className={`text-xl font-black leading-none sm:text-2xl ${theme.value}`}>{value}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-600 sm:text-xs">{label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
