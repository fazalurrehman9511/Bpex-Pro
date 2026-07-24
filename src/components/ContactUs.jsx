import { useEffect, useState } from 'react'
import { Mail, Send, CheckCircle2, MessageCircle } from 'lucide-react'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { submitContact } from '../utils/api'
import { openSupportWhatsApp } from '../utils/whatsapp'

const inputClass =
  'w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors'

export default function ContactUs() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    loadSupportWhatsAppNumber().catch(() => {})
  }, [])

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Name is required'
    if (!phone.trim()) next.phone = 'Phone number is required'
    else if (!/^[\d\s+\-()]{7,}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number'
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email'
    }
    if (!message.trim()) next.message = 'Message is required'
    else if (message.trim().length < 10) next.message = 'Message is too short'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await submitContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        subject: subject.trim() || 'General inquiry',
        message: message.trim(),
      })
      setDone(true)
      setName('')
      setPhone('')
      setEmail('')
      setSubject('')
      setMessage('')
      setErrors({})
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="bg-navy px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          <div>
            <h2 className="text-base font-bold text-text sm:text-lg">Contact Us</h2>
            <p className="text-xs text-muted">Send a message — we reply within minutes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded border border-border bg-navy-light p-4 sm:p-5">
            {done ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-accent" />
                <p className="text-sm font-bold text-text">Message sent</p>
                <p className="max-w-sm text-xs text-muted">
                  Thanks for reaching out. Our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-2 rounded border border-border px-4 py-2 text-xs font-semibold text-muted hover:border-accent/40 hover:text-text transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-xs font-semibold text-text">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className={inputClass}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-semibold text-text">
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      autoComplete="tel"
                      className={inputClass}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold text-text">
                      Email <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold text-text">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Deposit, withdraw, account…"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold text-text">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    className={`${inputClass} resize-y min-h-[100px]`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>

                {submitError && (
                  <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3 text-sm font-bold text-navy-dark hover:bg-accent-hover transition-colors disabled:opacity-60 sm:w-auto sm:min-w-[180px]"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <aside className="rounded border border-border bg-navy-light p-4 sm:p-5">
            <p className="text-sm font-bold text-text">Need faster help?</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Chat with your local agent on WhatsApp for deposits, withdrawals, and account support.
            </p>
            <button
              type="button"
              onClick={() =>
                openSupportWhatsApp(
                  'Hi BpxPro Support! 👋\n\nI need help with deposits, withdrawals, or my account.\nPlease assist me.',
                )
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-accent/15 border border-accent/30 px-4 py-2.5 text-xs font-bold text-accent hover:bg-accent/25 transition-colors"
            >
              <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              WhatsApp Support
            </button>
            <ul className="mt-4 space-y-2 text-[11px] text-muted">
              <li>· 24/7 agent support</li>
              <li>· JazzCash · EasyPaisa · Bank · Crypto</li>
              <li>· Typical reply under 5 minutes</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
