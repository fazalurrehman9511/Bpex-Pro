import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { openSupportWhatsApp } from '../utils/whatsapp'
import { useModal } from '../context/ModalContext'

const AGENT = {
  name: 'BpxPro Support',
  status: 'Online · usually replies in minutes',
}

const STEPS = [
  {
    id: 'age',
    question: 'Are you 18 years or older?',
    options: [
      { label: 'Yes, I am 18+', value: 'Yes, 18+' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    id: 'experience',
    question: 'Have you used a betting platform before?',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No, first time', value: 'No, first time' },
    ],
  },
  {
    id: 'deposit',
    question: 'How much do you plan to deposit initially?',
    options: [
      { label: 'Rs. 500', value: 'Rs. 500' },
      { label: 'Rs. 1,000', value: 'Rs. 1,000' },
      { label: 'Rs. 5,000', value: 'Rs. 5,000' },
      { label: 'Rs. 10,000+', value: 'Rs. 10,000+' },
    ],
    allowCustom: true,
    customPlaceholder: 'Or type amount…',
  },
  {
    id: 'method',
    question: 'What is your preferred deposit method?',
    options: [
      { label: 'JazzCash', value: 'JazzCash' },
      { label: 'EasyPaisa', value: 'EasyPaisa' },
      { label: 'Bank Transfer', value: 'Bank Transfer' },
      { label: 'Crypto (USDT)', value: 'Crypto (USDT)' },
    ],
  },
  {
    id: 'ready',
    question: 'Are you ready to create your betting account?',
    options: [
      { label: 'Yes, let’s go', value: 'Yes' },
      { label: 'Not yet', value: 'Not yet' },
    ],
  },
]

function welcomeMessages() {
  return [
    {
      id: 'welcome',
      from: 'agent',
      text: 'Assalam o Alaikum! 👋 Welcome to BpxPro.',
    },
    {
      id: 'intro',
      from: 'agent',
      text: 'I’ll ask a few quick questions to set up your account.',
    },
    {
      id: `q-${STEPS[0].id}`,
      from: 'agent',
      text: STEPS[0].question,
    },
  ]
}

function buildSummary(answers) {
  return [
    'Hi BpxPro! 👋 I want to create a betting account.',
    '',
    `• 18+: ${answers.age}`,
    `• Used betting before: ${answers.experience}`,
    `• Initial deposit: ${answers.deposit}`,
    `• Deposit method: ${answers.method}`,
    `• Ready to create account: ${answers.ready}`,
    '',
    'Please help me get started.',
  ].join('\n')
}

export default function FloatingWhatsApp() {
  const { openModal } = useModal()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [pendingSummary, setPendingSummary] = useState('')
  const [messages, setMessages] = useState(welcomeMessages)
  const listRef = useRef(null)
  const msgId = useRef(0)

  const nextId = (prefix) => {
    msgId.current += 1
    return `${prefix}-${msgId.current}`
  }

  const step = STEPS[stepIndex]
  const showOptions = open && !done && !blocked && step
  const showCreateChoices = done && !!pendingSummary

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, messages, stepIndex, done, pendingSummary])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    loadSupportWhatsAppNumber().catch(() => {})
  }, [])

  const resetChat = () => {
    setDraft('')
    setStepIndex(0)
    setAnswers({})
    setDone(false)
    setBlocked(false)
    setPendingSummary('')
    setMessages(welcomeMessages())
  }

  const finishWithChoices = (finalAnswers) => {
    const summary = buildSummary(finalAnswers)
    setMessages((prev) => [
      ...prev,
      {
        id: nextId('agent'),
        from: 'agent',
        text: 'Great! Choose how you want to create your account:',
      },
    ])
    setDone(true)
    setAnswers(finalAnswers)
    setPendingSummary(summary)
  }

  const openWhatsAppWithAnswers = () => {
    if (pendingSummary) openSupportWhatsApp(pendingSummary)
  }

  const openSelfRegister = () => {
    setOpen(false)
    openModal('register', { registerPath: 'self' })
  }

  const answerStep = (value) => {
    if (done || blocked || !step) return
    const trimmed = String(value).trim()
    if (!trimmed) return

    const nextAnswers = { ...answers, [step.id]: trimmed }
    setAnswers(nextAnswers)
    setDraft('')

    const userMsg = { id: nextId('user'), from: 'user', text: trimmed }
    const agentMsgs = []

    if (step.id === 'age' && /^no$/i.test(trimmed)) {
      agentMsgs.push({
        id: nextId('agent'),
        from: 'agent',
        text: 'Sorry — BpxPro is only for users 18 years or older. Bet responsibly.',
      })
      setMessages((prev) => [...prev, userMsg, ...agentMsgs])
      setBlocked(true)
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      agentMsgs.push({
        id: nextId('agent'),
        from: 'agent',
        text: STEPS[nextIndex].question,
      })
      setMessages((prev) => [...prev, userMsg, ...agentMsgs])
      setStepIndex(nextIndex)
      return
    }

    setMessages((prev) => [...prev, userMsg])

    if (step.id === 'ready' && /not yet/i.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId('agent'),
          from: 'agent',
          text: 'No problem! Come back anytime when you’re ready. Tap Restart to begin again.',
        },
      ])
      setDone(true)
      return
    }

    finishWithChoices(nextAnswers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!showOptions) return
    if (step.allowCustom && draft.trim()) {
      answerStep(draft)
      return
    }
    /* Free text only allowed on custom amount step */
  }

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className="flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-navy-light shadow-2xl shadow-black/40 animate-slide-up"
          role="dialog"
          aria-label="WhatsApp chat"
        >
          <div className="flex items-center gap-3 bg-[#075E54] px-3.5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-navy-dark">
              <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{AGENT.name}</p>
              <p className="truncate text-[10px] text-white/70">{AGENT.status}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex max-h-72 flex-col gap-2 overflow-y-auto px-3 py-3"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(37,211,102,0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(7,94,84,0.2), transparent 45%)',
              backgroundColor: '#0b1220',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                  m.from === 'user'
                    ? 'ml-auto rounded-br-md bg-accent/90 text-navy-dark'
                    : 'mr-auto rounded-bl-md bg-navy-dark text-text border border-border'
                }`}
              >
                {m.text}
              </div>
            ))}

            {showOptions && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {step.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => answerStep(opt.value)}
                    className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold text-accent hover:bg-accent/20 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {showCreateChoices && (
              <div className="mt-1 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={openSelfRegister}
                  className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-left text-[10px] font-semibold text-accent hover:bg-accent/20 transition-colors"
                >
                  Create account myself
                </button>
                <button
                  type="button"
                  onClick={openWhatsAppWithAnswers}
                  className="rounded-full border border-border bg-navy-dark px-2.5 py-1.5 text-left text-[10px] font-semibold text-muted hover:border-accent/40 hover:text-text transition-colors"
                >
                  Continue on WhatsApp with agent
                </button>
              </div>
            )}

            {(done || blocked) && (
              <button
                type="button"
                onClick={resetChat}
                className="mt-1 self-start rounded-full border border-border bg-navy-dark px-3 py-1.5 text-[10px] font-semibold text-muted hover:text-text hover:border-accent/40 transition-colors"
              >
                Restart chat
              </button>
            )}
          </div>

          {showOptions && step.allowCustom ? (
            <form
              className="flex items-center gap-2 border-t border-border bg-navy-dark px-2.5 py-2.5"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={step.customPlaceholder || 'Type your answer…'}
                className="min-w-0 flex-1 rounded-full border border-border bg-navy-light px-3.5 py-2 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-navy-dark hover:bg-accent-hover transition-colors disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="border-t border-border bg-navy-dark px-3 py-2.5">
              <p className="text-center text-[10px] text-muted">
                {showCreateChoices
                  ? 'Pick Create Myself or WhatsApp Agent'
                  : done
                    ? 'Tap Restart to begin again'
                    : blocked
                      ? 'Chat ended'
                      : `Question ${stepIndex + 1} of ${STEPS.length}`}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-navy-dark shadow-lg shadow-accent/30 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all sm:h-16 sm:w-16"
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-7 w-7 sm:h-8 sm:w-8" />
        ) : (
          <>
            <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" strokeWidth={0} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white animate-pulse">
              1
            </span>
          </>
        )}
      </button>
    </div>
  )
}
