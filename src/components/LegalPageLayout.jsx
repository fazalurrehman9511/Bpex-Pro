import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LegalPageLayout({
  title,
  intro,
  lastUpdated,
  children,
}) {
  return (
    <div className="min-h-screen bg-navy">
      <section className="border-b border-border px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Legal
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-text sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{intro}</p>
            <p className="mt-3 text-xs font-medium text-muted/80">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-2xl border border-border bg-navy-dark p-5 sm:p-6">
            <div className="legal-content space-y-6">{children}</div>
          </article>

          <aside className="h-fit rounded-2xl border border-border bg-navy-dark p-5 sm:p-6">
            <p className="text-sm font-bold text-text">Need help?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If you have questions about these terms or your account data, contact support through
              the website contact form or WhatsApp support.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="/#contact"
                className="block rounded-xl border border-border bg-navy px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/40 hover:text-accent"
              >
                Open Contact Section
              </a>
              <a
                href="/#contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-navy-dark transition-colors hover:bg-accent-hover"
              >
                <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                Contact Support
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
