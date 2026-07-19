import { MessageCircle, Wallet, Trophy } from 'lucide-react'

const steps = [
  {
    icon: MessageCircle,
    step: '01',
    title: 'Register on WhatsApp',
    desc: 'Select your country, enter name & phone — connected to your local agent instantly.',
  },
  {
    icon: Wallet,
    step: '02',
    title: 'Add Balance',
    desc: 'Deposit via JazzCash, EasyPaisa, Bank Transfer or Crypto. Funds added in minutes.',
  },
  {
    icon: Trophy,
    step: '03',
    title: 'Start Betting',
    desc: 'Place bets on cricket, football, tennis, casino & more through your agent.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-navy px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-1 text-base font-bold text-text sm:text-lg">How It Works</h2>
        <p className="mb-6 text-xs text-muted">Get started in 3 simple steps</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, desc }) => (
            <div
              key={step}
              className="relative rounded border border-border bg-navy-light p-4 pt-5"
            >
              <span className="absolute -top-2.5 left-4 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-navy-dark">
                STEP {step}
              </span>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-text">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
