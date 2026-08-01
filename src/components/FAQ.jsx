import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useHomepageContent } from '../context/HomepageContentContext'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { openSupportWhatsApp } from '../utils/whatsapp'

export default function FAQ() {
  const { faq } = useHomepageContent()
  const [open, setOpen] = useState(0)

  useEffect(() => {
    loadSupportWhatsAppNumber().catch(() => {})
  }, [])

  return (
    <section id="faq" className="section-tint-violet px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="editorial-section-label">Support</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{faq.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{faq.subtitle}</p>
        </div>

        <div className="space-y-3">
          {faq.items.map(({ q, a }, i) => (
            <div
              key={`${q}-${i}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
                className="flex w-full min-h-11 cursor-pointer items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/40"
              >
                <span className="pr-4 text-sm font-semibold text-slate-900 sm:text-base">{q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-emerald-600 transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <div className="border-t border-slate-100 px-5 pb-4 pt-1">
                  <p className="text-sm leading-relaxed text-slate-600">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <p className="text-base font-bold text-slate-900">{faq.supportTitle}</p>
          <p className="mt-2 text-sm text-slate-600">{faq.supportText}</p>
          <button
            type="button"
            onClick={() => {
              void openSupportWhatsApp(
                'Hi BpxPro Support! 👋\n\nI have a few questions before getting started.\nPlease assist me.',
              ).catch(() => {})
            }}
            className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition-colors hover:from-violet-700 hover:to-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            {faq.supportCta}
          </button>
        </div>
      </div>
    </section>
  )
}
