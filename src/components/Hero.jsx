import { MessageCircle, Shield, Zap, Clock, Smartphone, Wallet, Download } from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { scrollToSection } from '../utils/detectCountry'
import { ANDROID_APK_URL, ANDROID_APK_AVAILABLE } from '../config/androidApp'

const highlights = [
  { icon: Shield, text: 'Trusted agent since 2018' },
  { icon: Zap, text: '5 min avg payout speed' },
  { icon: Clock, text: '24/7 WhatsApp support' },
  { icon: Smartphone, text: 'Android APK available' },
]

export default function Hero() {
  const { openModal } = useModal()

  return (
    <section className="relative overflow-hidden bg-navy px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,211,102,0.12)_0%,_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-header-blue/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded bg-accent/10 border border-accent/30 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            LIVE — Markets Open
          </div>
          <div className="inline-flex items-center gap-1.5 rounded bg-navy-light border border-border px-3 py-1 text-[11px] font-medium text-muted">
            🌍 4 Countries · Local Agents
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
            <li key={text} className="flex items-center gap-2 text-[11px] text-muted sm:text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
          <button
            type="button"
            onClick={() => openModal('register')}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded bg-accent px-8 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/25 hover:bg-accent-hover transition-all active:scale-[0.98] sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
            WhatsApp Register
          </button>
          {ANDROID_APK_AVAILABLE ? (
            <a
              href={ANDROID_APK_URL}
              download
              type="application/vnd.android.package-archive"
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-accent/40 bg-accent/10 px-8 py-3.5 text-sm font-bold text-accent hover:bg-accent/20 transition-colors sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Install App
            </a>
          ) : null}
          
        </div>
      </div>
    </section>
  )
}
