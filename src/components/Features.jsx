import { Shield, Headphones, Award, Smartphone } from 'lucide-react'
import { useHomepageContent } from '../context/HomepageContentContext'

const featureIcons = [Shield, Headphones, Award, Smartphone]
const featureThemes = [
  { top: 'from-emerald-500 to-teal-500', icon: 'bg-emerald-100 text-emerald-700' },
  { top: 'from-sky-500 to-cyan-500', icon: 'bg-sky-100 text-sky-700' },
  { top: 'from-amber-500 to-orange-500', icon: 'bg-amber-100 text-amber-700' },
  { top: 'from-violet-500 to-purple-500', icon: 'bg-violet-100 text-violet-700' },
]

export default function Features() {
  const { features } = useHomepageContent()

  return (
    <section className="section-tint-violet px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="editorial-section-label">Platform benefits</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {features.title}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          {features.items.map(({ title, desc }, index) => {
            const Icon = featureIcons[index % featureIcons.length]
            const theme = featureThemes[index % featureThemes.length]
            return (
              <div
                key={`${title}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-lg shadow-violet-900/5 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className={`h-1.5 bg-gradient-to-r ${theme.top}`} />
                <div className="p-5 sm:p-6">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
