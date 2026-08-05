import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sectionLinkTarget } from '../utils/detectCountry'

const contactLink = sectionLinkTarget('contact')

export default function LegalPageLayout({
  title,
  intro,
  lastUpdated,
  badge = 'Legal',
  theme = 'dark',
  children,
}) {
  const isLight = theme === 'light'

  return (
    <div className={isLight ? 'min-h-screen bg-slate-50' : 'min-h-screen bg-navy'}>
      <section
        className={
          isLight
            ? 'hero-mesh relative overflow-hidden border-b border-emerald-200/60 px-4 py-10 sm:px-6 sm:py-14'
            : 'border-b border-border px-4 py-10 sm:px-6 sm:py-14'
        }
      >
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/"
            className={
              isLight
                ? 'mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-emerald-700'
                : 'mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent'
            }
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div
              className={
                isLight
                  ? 'inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 shadow-sm'
                  : 'inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1'
              }
            >
              <ShieldCheck className={`h-4 w-4 ${isLight ? 'text-emerald-700' : 'text-accent'}`} />
              <span
                className={
                  isLight
                    ? 'text-xs font-bold uppercase tracking-wider text-emerald-800'
                    : 'text-xs font-bold uppercase tracking-wider text-accent'
                }
              >
                {badge}
              </span>
            </div>
            <h1
              className={
                isLight
                  ? 'mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl'
                  : 'mt-4 text-3xl font-extrabold leading-tight tracking-tight text-text sm:text-4xl'
              }
            >
              {title}
            </h1>
            <p
              className={
                isLight
                  ? 'mt-4 text-sm leading-relaxed text-slate-600 sm:text-base'
                  : 'mt-4 text-sm leading-relaxed text-muted sm:text-base'
              }
            >
              {intro}
            </p>
            <p
              className={
                isLight
                  ? 'mt-3 text-xs font-medium text-slate-500'
                  : 'mt-3 text-xs font-medium text-muted/80'
              }
            >
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <section
        className={
          isLight
            ? 'section-tint-emerald px-4 py-8 sm:px-6 sm:py-10'
            : 'px-4 py-8 sm:px-6 sm:py-10'
        }
      >
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article
            className={
              isLight
                ? 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'
                : 'rounded-2xl border border-border bg-navy-dark p-5 sm:p-6'
            }
          >
            <div className={`legal-content space-y-6${isLight ? ' legal-content-light' : ''}`}>{children}</div>
          </article>

          <aside
            className={
              isLight
                ? 'h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'
                : 'h-fit rounded-2xl border border-border bg-navy-dark p-5 sm:p-6'
            }
          >
            <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-text'}`}>
              Need help?
            </p>
            <p
              className={
                isLight
                  ? 'mt-2 text-sm leading-relaxed text-slate-600'
                  : 'mt-2 text-sm leading-relaxed text-muted'
              }
            >
              If you have questions about these terms or your account data, contact support through
              the website contact form or WhatsApp support.
            </p>
            <div className="mt-4 space-y-2">
              <Link
                to={contactLink}
                className={
                  isLight
                    ? 'block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:text-emerald-800'
                    : 'block rounded-xl border border-border bg-navy px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/40 hover:text-accent'
                }
              >
                Open Contact Section
              </Link>
              <Link
                to={contactLink}
                className={
                  isLight
                    ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700'
                    : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-navy-dark transition-colors hover:bg-accent-hover'
                }
              >
                <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                Contact Support
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
