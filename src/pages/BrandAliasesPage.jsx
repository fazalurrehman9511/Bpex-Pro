import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Globe2,
  MessageCircle,
  Search,
  Shield,
  UserPlus,
} from 'lucide-react'
import SeoHead from '../components/SeoHead'
import { useModal } from '../context/ModalContext'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'
import { ANDROID_APK_AVAILABLE, ANDROID_APK_URL } from '../config/androidApp'
import { BRAND_ALIASES, BRAND_ALIAS_TEXT, BRAND_NAME, SITE_URL } from '../config/brand'

const aliasCards = [
  {
    alias: 'BPX',
    note: 'Short brand version commonly typed in chats, direct searches and quick referrals.',
  },
  {
    alias: 'BPEXCH',
    note: 'Exchange-style shortcut that players often search when looking for the dashboard or login.',
  },
  {
    alias: 'BettPro',
    note: 'A spelling variation some users use when searching for the same betting platform.',
  },
]

const highlights = [
  'Same official platform, same WhatsApp agents, same betting exchange access.',
  'Cricket, football, tennis, live casino and fast local payment options.',
  'Direct routes for registration, app download and dashboard access.',
]

export default function BrandAliasesPage() {
  const { openModal } = useModal()
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

  const seoTitle = 'BpxPro, BPX, BPEXCH & BettPro | Official Brand Names'
  const seoDescription =
    'BpxPro is also searched as BPX, BPEXCH, BPXPRO, BettPro and Bett Pro. Same official betting exchange platform, same WhatsApp agents and same dashboard access.'
  const canonicalPath = '/bpx'

  return (
    <div className="min-h-screen bg-navy">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        ogTitle="BpxPro, BPX, BPEXCH & BettPro"
        ogDescription={seoDescription}
        twitterTitle="BpxPro, BPX, BPEXCH & BettPro"
        twitterDescription={seoDescription}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: seoTitle,
          url: `${SITE_URL}${canonicalPath}`,
          description: seoDescription,
          about: {
            '@type': 'Organization',
            name: BRAND_NAME,
            alternateName: BRAND_ALIASES,
          },
          keywords: BRAND_ALIASES.join(', '),
        }}
      />

      <section className="relative overflow-hidden border-b border-border px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,211,102,0.14)_0%,_transparent_55%)]" />
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-header-blue/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1">
              <Search className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Official Brand Guide
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
              {BRAND_NAME}, BPX, BPEXCH, BPXPRO, BettPro &amp; Bett Pro
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              If you searched for {BRAND_ALIAS_TEXT}, you are looking for the same official platform.
              {` `}
              {BRAND_NAME} is the main brand, and these names all point to the same betting exchange,
              WhatsApp agent service and dashboard experience.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {BRAND_ALIASES.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-border bg-navy-light px-3 py-1 text-xs font-semibold text-text"
              >
                {alias}
              </span>
            ))}
          </div>

          {loggedIn ? (
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                to="/dashboard"
                onClick={openDashboard}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
              >
                Open Dashboard
              </Link>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download="bpexpro.apk"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-header-blue/70 bg-header-blue px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-header-blue/20 transition-colors hover:border-header-blue hover:bg-header-blue/90"
                >
                  <Download className="h-4 w-4 text-white" aria-hidden="true" />
                  Download App
                </a>
              )}
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
              >
                <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                Register with Agent
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-navy-light px-6 py-3.5 text-sm font-bold text-text transition-colors hover:border-accent/40"
              >
                <UserPlus className="h-4 w-4 text-accent" />
                Register Myself
              </button>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download="bpexpro.apk"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-header-blue/70 bg-header-blue px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-header-blue/20 transition-colors hover:border-header-blue hover:bg-header-blue/90"
                >
                  <Download className="h-4 w-4 text-white" aria-hidden="true" />
                  Download App
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {aliasCards.map(({ alias, note }) => (
            <div key={alias} className="rounded-2xl border border-border bg-navy-dark p-5">
              <p className="text-sm font-bold text-accent">{alias}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-border bg-navy-dark p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Same Platform
              </span>
            </div>
            <h2 className="text-xl font-bold text-text">What these names actually mean</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Users often search different brand spellings before they reach the right site. On
              this project, BpxPro is the main public brand and the aliases {BRAND_ALIAS_TEXT} are
              treated as the same platform identity.
            </p>
            <div className="mt-5 space-y-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-sm leading-relaxed text-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-navy-dark p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-header-blue/20 bg-header-blue/10 px-3 py-1">
              <Globe2 className="h-4 w-4 text-header-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-header-blue">
                Next Steps
              </span>
            </div>
            <h2 className="text-xl font-bold text-text">Useful links</h2>
            <div className="mt-5 space-y-3">
              <Link
                to="/blog/bpx-bpexch-bettpro-brand-guide"
                className="block rounded-xl border border-border bg-navy px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/40 hover:text-accent"
              >
                Read the full BPX / BPEXCH / BettPro brand guide
              </Link>
              <Link
                to="/blog"
                className="block rounded-xl border border-border bg-navy px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/40 hover:text-accent"
              >
                Explore all betting guides and payment posts
              </Link>
              <a
                href="#faq"
                className="block rounded-xl border border-border bg-navy px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/40 hover:text-accent"
              >
                Go to homepage FAQ and support section
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
