import { MessageCircle, Shield, Zap, Clock, UserPlus, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ANDROID_APK_AVAILABLE, ANDROID_APK_URL } from '../config/androidApp'
import { BRAND_ALIAS_TEXT } from '../config/brand'
import { useHomepageContent } from '../context/HomepageContentContext'
import { useModal } from '../context/ModalContext'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'

const highlightIcons = [Shield, Zap, Clock, UserPlus]
const highlightColors = [
  'bg-emerald-500 text-white',
  'bg-sky-500 text-white',
  'bg-amber-500 text-white',
  'bg-violet-500 text-white',
]

export default function Hero() {
  const { openModal } = useModal()
  const content = useHomepageContent()
  const hero = content.hero
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

  return (
    <section className="hero-mesh relative overflow-hidden border-b border-emerald-200/60 px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-16">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#25D366]" />
              {hero.badgeLive}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/50 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm">
              {hero.badgeCountries}
            </div>
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.035em] text-slate-900 sm:text-5xl lg:text-6xl">
            {hero.headlinePrefix}{' '}
            <span className="text-gradient-brand">{hero.headlineAccent}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            {hero.subtitle}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-600">
            Also searched as {BRAND_ALIAS_TEXT}.{' '}
            <Link to="/bpx" className="font-semibold text-emerald-700 underline-offset-4 transition-colors hover:text-teal-700 hover:underline">
              Official brand guide
            </Link>
          </p>

          {loggedIn ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/dashboard"
                onClick={openDashboard}
                className="btn-whatsapp inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98] sm:w-auto"
              >
                Open Dashboard
              </Link>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download
                  aria-label="Download Android app"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-400/60 bg-sky-500/10 px-6 py-3.5 text-sm font-bold text-sky-800 shadow-sm transition hover:bg-sky-500/20 active:scale-[0.98] sm:w-auto"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download App
                </a>
              )}
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                aria-label={hero.ctaAgent}
                className="btn-whatsapp inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98] sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                {hero.ctaAgent}
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                aria-label={hero.ctaSelf}
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/50 bg-white/80 px-6 py-3.5 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] sm:w-auto"
              >
                <UserPlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {hero.ctaSelf}
              </button>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download
                  aria-label="Download Android app"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-400/60 bg-sky-500/10 px-6 py-3.5 text-sm font-bold text-sky-800 shadow-sm transition hover:bg-sky-500/20 active:scale-[0.98] sm:w-auto"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download App
                </a>
              )}
            </div>
          )}
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-5 rotate-2 rounded-[2rem] bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-sky-400/30 blur-sm" />
          <div className="relative rounded-3xl border border-white/60 bg-white/90 p-7 shadow-2xl shadow-emerald-900/10 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between border-b border-emerald-100 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Why players choose us</p>
              <span className="h-2.5 w-2.5 rounded-full bg-[#25D366] ring-4 ring-emerald-100" />
            </div>
            <ul className="space-y-5">
              {hero.highlights.map((text, index) => {
                const Icon = highlightIcons[index % highlightIcons.length]
                const color = highlightColors[index % highlightColors.length]
                return (
                  <li key={`${text}-${index}`} className="flex items-center gap-4 text-sm font-semibold text-slate-800">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 lg:hidden">
          {hero.highlights.map((text, index) => {
            const Icon = highlightIcons[index % highlightIcons.length]
            const color = highlightColors[index % highlightColors.length]
            return (
              <li key={`${text}-${index}`} className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-white/80 px-3 py-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {text}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
