import { Shield, Headphones, Award, Smartphone } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: '100% Secure',
    desc: 'Operating since 2018. Every transaction confirmed on WhatsApp with your personal agent.',
  },
  {
    icon: Headphones,
    title: 'Personal Agent',
    desc: 'Dedicated agent for bets, deposits, withdrawals and support — available 24/7.',
  },
  {
    icon: Award,
    title: 'Best Odds',
    desc: 'Top back & lay rates on cricket, football, tennis, horse racing and live casino.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    desc: 'Works on any phone. Install as app or use in browser — same experience.',
  },
]

export default function Features() {
  return (
    <section className="bg-navy px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-5 text-base font-bold text-text sm:text-lg">
          Why BpxPro?
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded border border-border bg-navy-light p-3 sm:p-4"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-accent/10">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-xs font-bold text-text sm:text-sm">{title}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-muted sm:text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
