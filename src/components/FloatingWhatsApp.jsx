import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { openSupportWhatsApp, QUICK_CHAT_OPTIONS } from '../utils/whatsapp'
import { useModal } from '../context/ModalContext'
import WhatsAppIcon from './WhatsAppIcon'

const AGENT = {
  name: 'BpxPro Support',
  status: 'Online · usually replies in minutes',
}

const WELCOME_TEXT =
  'Assalam o Alaikum! 👋\n\nWelcome to BpxPro. Tap a quick option below or open WhatsApp to chat with our support team.'

export default function FloatingWhatsApp() {
  const { openModal } = useModal()
  const location = useLocation()
  const isBlogPost = location.pathname.startsWith('/blog/') && location.pathname !== '/blog'
  const bottomClass = isBlogPost ? 'bottom-6' : 'bottom-[5.5rem] sm:bottom-6'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadSupportWhatsAppNumber().catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const openWhatsApp = (text) => {
    openSupportWhatsApp(text)
    setOpen(false)
  }

  const openSelfRegister = () => {
    setOpen(false)
    openModal('register', { registerPath: 'self' })
  }

  return (
    <div className={`fixed ${bottomClass} right-4 z-30 flex flex-col items-end gap-3 sm:right-6`}>
      {open && (
        <div
          className="flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-[#dcf8c6] bg-white shadow-2xl shadow-slate-900/15 animate-slide-up"
          role="dialog"
          aria-label="WhatsApp chat"
        >
          <div className="flex items-center gap-3 bg-[#075E54] px-3.5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{AGENT.name}</p>
              <p className="truncate text-[10px] text-white/70">{AGENT.status}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className="flex max-h-80 flex-col gap-3 overflow-y-auto px-3 py-4"
            style={{
              backgroundColor: '#e5ddd5',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d0c7\' fill-opacity=\'0.45\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          >
            <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-800 shadow-sm whitespace-pre-line">
              {WELCOME_TEXT}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => openWhatsApp(opt.text)}
                  className="rounded-full border border-[#25D366]/40 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#128C7E] shadow-sm transition-colors hover:bg-[#dcf8c6]"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => openWhatsApp(QUICK_CHAT_OPTIONS[0].text)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#1ebe57]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Open WhatsApp
              </button>
              <button
                type="button"
                onClick={openSelfRegister}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:border-[#25D366]/50 hover:text-[#128C7E]"
              >
                Register Myself
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/35 transition-all hover:scale-105 hover:bg-[#1ebe57] active:scale-95 sm:h-16 sm:w-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        aria-label={open ? 'Close chat' : 'Open WhatsApp chat'}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-7 w-7 sm:h-8 sm:w-8" />
        ) : (
          <>
            <WhatsAppIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
              1
            </span>
          </>
        )}
      </button>
    </div>
  )
}
