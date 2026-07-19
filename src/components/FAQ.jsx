import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useModal } from '../context/ModalContext'

const faqs = [
  {
    q: 'How do I register?',
    a: 'Two ways: (1) Create Myself — pick username/password on the site and your BPEXCH account is created instantly. (2) WhatsApp Agent — message your local agent and they set up your account. Same options work after installing the Android app.',
  },
  {
    q: 'How can I add balance?',
    a: 'Choose JazzCash, EasyPaisa, Bank Transfer or Crypto from the Add Balance section. Your country agent will share account details and confirm your deposit on WhatsApp.',
  },
  {
    q: 'Which countries are supported?',
    a: 'We have dedicated agents in Pakistan, UAE, Saudi Arabia, United Kingdom, Bangladesh and India. Select your country during registration to connect with the right agent.',
  },
  {
    q: 'How fast are withdrawals?',
    a: 'Most withdrawals are processed within 5–15 minutes via JazzCash, EasyPaisa or bank transfer. Crypto withdrawals may take up to 30 minutes.',
  },
  {
    q: 'How do I install the Android app?',
    a: 'Phone pe Chrome mein BpxPro kholo → menu (⋮) → Install app / Add to Home screen. APK ki zaroorat nahi. Home screen pe icon aa jayega aur app ki tarah open hogi.',
  },
  {
    q: 'Is my money safe?',
    a: 'BpxPro has been operating since 2018 with 15,000+ active users. Every transaction is handled personally by your assigned agent with full WhatsApp confirmation.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)
  const { openModal } = useModal()

  return (
    <section id="faq" className="bg-navy-dark px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-1 text-base font-bold text-text sm:text-lg">FAQ</h2>
        <p className="mb-5 text-xs text-muted">Common questions answered</p>

        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <div
              key={q}
              className="overflow-hidden rounded border border-border bg-navy-light"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-text pr-4">{q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-accent transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <div className="border-t border-border px-4 pb-3.5 pt-1">
                  <p className="text-xs leading-relaxed text-muted">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded border border-accent/20 bg-accent/5 p-4 text-center">
          <p className="text-sm font-semibold text-text">Still have questions?</p>
          <p className="mt-1 text-xs text-muted">Chat with your local agent on WhatsApp</p>
          <button
            onClick={() => openModal('contact')}
            className="mt-3 rounded bg-accent px-6 py-2 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors"
          >
            Contact Agent
          </button>
        </div>
      </div>
    </section>
  )
}
