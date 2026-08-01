import { useEffect, useState } from 'react'
import { Mail, Send, CheckCircle2, MessageCircle } from 'lucide-react'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { submitContact } from '../utils/api'
import { openSupportWhatsApp } from '../utils/whatsapp'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-colors'

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
    <section id="contact" className="section-tint-emerald border-t border-emerald-200/50 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="editorial-section-label">Get in touch</p>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Contact Us</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Send a message — we reply within minutes</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {done ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <p className="text-base font-bold text-slate-900">Message sent</p>
                <p className="max-w-sm text-sm text-slate-600">
                  Thanks for reaching out. Our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-2 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-slate-800">
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
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">
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
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                      Email <span className="font-normal text-slate-400">(optional)</span>
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
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold text-slate-800">
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
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    className={`${inputClass} min-h-[100px] resize-y`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                {submitError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-whatsapp inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 sm:w-auto sm:min-w-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <p className="text-base font-bold text-slate-900">Need faster help?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Chat with your local agent on WhatsApp for deposits, withdrawals, and account support.
            </p>
            <button
              type="button"
              onClick={() => {
                void openSupportWhatsApp(
                  'Hi BpxPro Support! 👋\n\nI need help with deposits, withdrawals, or my account.\nPlease assist me.',
                ).catch(() => {})
              }}
              className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
            >
              <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              WhatsApp Support
            </button>
            <ul className="mt-5 space-y-2 text-sm text-slate-500">
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
