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
import { useBrandGuideContent } from '../context/BrandGuideContentContext'
import { getBrandGuidePath } from '../data/brandGuideContent'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'
import { ANDROID_APK_AVAILABLE, ANDROID_APK_URL } from '../config/androidApp'
import { BRAND_NAME, SITE_URL } from '../config/brand'
import { sectionLinkTarget } from '../utils/detectCountry'

function linkTarget(path) {
  const value = String(path || '').trim()
  if (!value) return { to: '/' }
  if (value.startsWith('/#')) {
    return { to: sectionLinkTarget(value.slice(2)) }
  }
  return { to: value }
}

export default function BrandAliasesPage() {
  const { openModal } = useModal()
  const content = useBrandGuideContent()
  const { seo, hero, aliasCards, platform, links } = content
  const canonicalPath = getBrandGuidePath(content)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeoHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.metaKeywords}
        canonicalPath={canonicalPath}
        ogTitle={seo.metaTitle}
        ogDescription={seo.metaDescription}
        twitterTitle={seo.metaTitle}
        twitterDescription={seo.metaDescription}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: seo.metaTitle,
          url: `${SITE_URL}${canonicalPath}`,
          description: seo.metaDescription,
          about: {
            '@type': 'Organization',
            name: BRAND_NAME,
            alternateName: hero.aliases,
          },
          keywords: seo.metaKeywords || hero.aliases.join(', '),
        }}
      />

      <section className="hero-mesh relative overflow-hidden border-b border-emerald-200/60 px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-emerald-700"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {hero.badge}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {hero.headline}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {hero.intro}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {hero.aliases.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
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
                className="btn-whatsapp inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98]"
              >
                Open Dashboard
              </Link>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download="bpexpro.apk"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700"
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
                className="btn-whatsapp inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                Register with Agent
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800"
              >
                <UserPlus className="h-4 w-4 text-emerald-700" />
                Register Myself
              </button>
              {ANDROID_APK_AVAILABLE && (
                <a
                  href={ANDROID_APK_URL}
                  download="bpexpro.apk"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700"
                >
                  <Download className="h-4 w-4 text-white" aria-hidden="true" />
                  Download App
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section-tint-emerald px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {aliasCards.map(({ alias, note }) => (
            <div
              key={alias}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-bold text-emerald-700">{alias}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              <Shield className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {platform.badge}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{platform.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{platform.body}</p>
            <div className="mt-5 space-y-3">
              {platform.highlights.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-relaxed text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1">
              <Globe2 className="h-4 w-4 text-sky-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                {links.badge}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{links.title}</h2>
            <div className="mt-5 space-y-3">
              {links.items.map((item) => (
                <Link
                  key={`${item.label}-${item.path}`}
                  {...linkTarget(item.path)}
                  className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:text-emerald-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
