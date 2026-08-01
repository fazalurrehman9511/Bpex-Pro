import { MessageCircle, Wallet, Trophy } from 'lucide-react'
import { useHomepageContent } from '../context/HomepageContentContext'

const stepIcons = [MessageCircle, Wallet, Trophy]
const stepThemes = [
  { border: 'border-emerald-300', icon: 'bg-gradient-to-br from-emerald-500 to-teal-500', num: 'text-emerald-200' },
  { border: 'border-sky-300', icon: 'bg-gradient-to-br from-sky-500 to-cyan-500', num: 'text-sky-200' },
  { border: 'border-amber-300', icon: 'bg-gradient-to-br from-amber-500 to-orange-500', num: 'text-amber-200' },
]

export default function HowItWorks() {
  const { howItWorks } = useHomepageContent()

  return (
    <section id="how-it-works" className="section-tint-emerald px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="editorial-section-label">Simple by design</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{howItWorks.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">{howItWorks.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {howItWorks.steps.map(({ title, desc }, index) => {
            const Icon = stepIcons[index % stepIcons.length]
            const theme = stepThemes[index % stepThemes.length]
            const step = String(index + 1).padStart(2, '0')
            return (
              <div
                key={`${title}-${index}`}
                className={`group relative rounded-2xl border-2 ${theme.border} bg-white/90 p-6 shadow-lg shadow-emerald-900/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="mb-7 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ${theme.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-3xl font-black tracking-tight ${theme.num}`}>{step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
