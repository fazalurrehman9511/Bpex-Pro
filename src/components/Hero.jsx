import { MessageCircle, Shield, Zap, Clock, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'

const highlights = [
  { icon: Shield, text: 'Trusted agent since 2018' },
  { icon: Zap, text: '5 min avg payout speed' },
  { icon: Clock, text: '24/7 WhatsApp support' },
  { icon: UserPlus, text: 'Self-register in 60 seconds' },
]

export default function Hero() {
  const { openModal } = useModal()
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

  return (
    <section className="relative overflow-hidden bg-navy px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,211,102,0.12)_0%,_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-header-blue/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            LIVE — Markets Open
          </div>
          <div className="inline-flex items-center gap-1.5 rounded border border-border bg-navy-light px-3 py-1 text-xs font-medium text-muted">
            4 Countries · Local Agents
          </div>
        </div>

        <h1 className="max-w-xl text-2xl font-extrabold leading-snug tracking-tight text-text sm:text-4xl sm:leading-tight">
          Pakistan&apos;s #1{' '}
          <span className="text-accent">Betting Exchange</span>
        </h1>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          Cricket, Football, Tennis, Horse Racing &amp; Live Casino —
          best odds with your personal agent on WhatsApp. Register in 60 seconds.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-2">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-xs text-muted">
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>

        {loggedIn ? (
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              to="/dashboard"
              onClick={openDashboard}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover active:scale-[0.98] sm:w-auto"
            >
              Open Dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => openModal('register', { registerPath: 'whatsapp' })}
              aria-label="Register with WhatsApp agent"
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover active:scale-[0.98] sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              Register with Agent
            </button>
            <button
              type="button"
              onClick={() => openModal('register', { registerPath: 'self' })}
              aria-label="Create account yourself"
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded border border-border bg-navy-light px-6 py-3.5 text-sm font-bold text-text transition-colors hover:border-accent/40 active:scale-[0.98] sm:w-auto"
            >
              <UserPlus className="h-4 w-4 text-accent" aria-hidden="true" />
              Register Myself
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
