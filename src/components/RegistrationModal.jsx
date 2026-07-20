import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Globe,
  MessageCircle,
  Check,
  UserPlus,
  Eye,
  EyeOff,
  Copy,
  LayoutDashboard,
} from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { openWhatsApp } from '../utils/whatsapp'
import { getCountries, getCountryByCode, loadWhatsappAgents } from '../data/countries'
import { getPaymentMethod } from '../data/paymentMethods'
import { detectCountryCode } from '../utils/detectCountry'
import { fetchRegisterStatus, selfRegister } from '../utils/api'

const intentLabels = {
  register: 'Create Account',
  login: 'Login via WhatsApp',
  contact: 'Contact via WhatsApp',
  deposit: 'Add Balance via WhatsApp',
  withdraw: 'Withdraw via WhatsApp',
}

const inputClass =
  'w-full rounded border border-border bg-navy-dark px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors'

export default function RegistrationModal() {
  const { isOpen, intent, modalOptions, closeModal } = useModal()
  const navigate = useNavigate()
  const [path, setPath] = useState('whatsapp')
  const [countryCode, setCountryCode] = useState('PK')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [created, setCreated] = useState(null)
  const [selfAvailable, setSelfAvailable] = useState(true)
  const [agentCountries, setAgentCountries] = useState(() => getCountries())

  const paymentMethod = modalOptions.paymentMethod
    ? getPaymentMethod(modalOptions.paymentMethod)
    : null

  const selectedCountry = getCountryByCode(countryCode)
  const selfDial = getCountryByCode('PK')
  const isRegister = intent === 'register'
  const pathLocked =
    modalOptions.registerPath === 'self' || modalOptions.registerPath === 'whatsapp'

  useEffect(() => {
    if (!isOpen) return
    const nextPath = modalOptions.registerPath === 'self' ? 'self' : 'whatsapp'
    setPath(nextPath)
    setCountryCode(nextPath === 'self' ? 'PK' : detectCountryCode())
    setName('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
    setSubmitError('')
    setCreated(null)
    setShowPass(false)

    loadWhatsappAgents().then((list) => {
      setAgentCountries(list)
      if (nextPath !== 'self') {
        const codes = list.map((c) => c.code)
        setCountryCode((prev) => (codes.includes(prev) ? prev : list[0]?.code || 'PK'))
      }
    })

    if (intent === 'register') {
      fetchRegisterStatus()
        .then((data) => setSelfAvailable(data.selfRegisterAvailable !== false))
        .catch(() => setSelfAvailable(true))
    }
  }, [isOpen, intent, modalOptions.registerPath])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeModal])

  if (!isOpen) return null
  if (intent === 'deposit' || intent === 'withdraw') return null

  const validateWhatsApp = () => {
    const next = {}
    if (!countryCode) next.country = 'Please select your country'
    if (!name.trim()) next.name = 'Name is required'
    if (!phone.trim()) next.phone = 'Phone number is required'
    else if (!/^[\d\s+\-()]{7,}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateSelf = () => {
    const next = {}
    if (!password || password.length < 6) next.password = 'Min 6 characters'
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    if (!phone.trim()) next.phone = 'Phone number is required'
    else if (!/^[\d\s+\-()]{7,}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleWhatsApp = (e) => {
    e.preventDefault()
    if (!validateWhatsApp()) return
    openWhatsApp({
      name: name.trim(),
      phone: phone.trim(),
      intent,
      countryCode,
      paymentMethod: modalOptions.paymentMethod,
    })
    closeModal()
  }

  const handleSelfRegister = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validateSelf()) return
    setSubmitting(true)
    try {
      const data = await selfRegister({
        password,
        confirmPassword,
        phone: phone.trim(),
        name: name.trim(),
        countryCode: 'PK',
      })
      setCreated({
        username: data.user?.username || '',
        password,
      })
    } catch (err) {
      setSubmitError(err.message || 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  const copyCreds = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(
        `Username: ${created.username}\nPassword: ${created.password}`
      )
    } catch {
      /* ignore */
    }
  }

  const goLogin = () => {
    closeModal()
    navigate('/login')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={closeModal}
      />

      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-lg border border-border bg-navy-light p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />

        <button
          onClick={closeModal}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-text transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-1 flex items-center gap-2 pr-8">
          {isRegister && path === 'self' ? (
            <UserPlus className="h-5 w-5 text-accent" />
          ) : (
            <MessageCircle className="h-5 w-5 text-accent" fill="currentColor" strokeWidth={0} />
          )}
          <h2 id="modal-title" className="text-lg font-bold text-text">
            {isRegister
              ? path === 'self'
                ? 'Create Your Account'
                : 'Register via WhatsApp'
              : intentLabels[intent] || intentLabels.register}
          </h2>
        </div>

        {isRegister && !created && !pathLocked && (
          <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-navy-dark p-1">
            <button
              type="button"
              onClick={() => {
                setPath('whatsapp')
                setErrors({})
                setSubmitError('')
                const codes = agentCountries.map((c) => c.code)
                setCountryCode((prev) =>
                  codes.includes(prev) ? prev : agentCountries[0]?.code || detectCountryCode(),
                )
              }}
              className={`cursor-pointer rounded-md px-2 py-2 text-[11px] font-bold transition-colors ${
                path === 'whatsapp' ? 'bg-accent text-navy-dark' : 'text-muted hover:text-text'
              }`}
            >
              WhatsApp Agent
            </button>
            <button
              type="button"
              onClick={() => {
                setPath('self')
                setCountryCode('PK')
                setErrors({})
                setSubmitError('')
              }}
              className={`cursor-pointer rounded-md px-2 py-2 text-[11px] font-bold transition-colors ${
                path === 'self' ? 'bg-accent text-navy-dark' : 'text-muted hover:text-text'
              }`}
            >
              Create Myself
            </button>
          </div>
        )}

        <p className="mb-4 text-xs text-muted">
          {created
            ? 'Your BpxPro account is ready'
            : isRegister && path === 'self'
              ? 'Password set karein — username system auto generate karega'
              : 'Select country → enter details → connect with local agent'}
        </p>

        {paymentMethod && !created && (
          <div
            className="mb-4 flex items-center gap-3 rounded border border-border bg-navy-dark px-3 py-2.5"
            style={{ borderLeftColor: paymentMethod.accent, borderLeftWidth: 3 }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Payment</p>
              <p className="text-sm font-bold text-text">{paymentMethod.name}</p>
              <p className="text-[10px] text-muted">
                Min {paymentMethod.minDeposit} · {paymentMethod.processing}
              </p>
            </div>
          </div>
        )}

        {created ? (
          <div className="space-y-4">
            <div className="rounded border border-accent/40 bg-accent/10 px-4 py-3 text-center">
              <p className="text-sm font-bold text-accent">Account created</p>
              <p className="mt-1 text-xs text-muted">Save these login details</p>
            </div>
            <div className="space-y-2 rounded border border-border bg-navy-dark px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase text-muted">Username (auto)</p>
                  <p className="text-sm font-bold text-text">{created.username}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted">Password</p>
                <p className="text-sm font-bold text-text">{created.password}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyCreds}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border px-3 py-2.5 text-xs font-semibold text-muted hover:border-accent/40 hover:text-text transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                type="button"
                onClick={goLogin}
                className="flex flex-1 items-center justify-center gap-1.5 rounded bg-accent px-3 py-2.5 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Go to Login
              </button>
            </div>
          </div>
        ) : path === 'self' && isRegister ? (
          <form onSubmit={handleSelfRegister} className="space-y-3.5" noValidate>
            {!selfAvailable && (
              <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                Self-register needs a Master agent account on the server. You can still use WhatsApp
                Agent.
              </p>
            )}

            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-xs font-semibold text-text">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-text"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="mb-1.5 block text-xs font-semibold text-text">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={inputClass}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-name" className="mb-1.5 block text-xs font-semibold text-text">
                Full Name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="mb-1.5 block text-xs font-semibold text-text">
                Phone Number
              </label>
              <div className="flex gap-2">
                <span className="flex shrink-0 items-center rounded border border-border bg-navy-dark px-3 text-sm text-muted">
                  {selfDial.dialCode}
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={selfDial.phonePlaceholder}
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            {submitError && (
              <div className="space-y-2">
                <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {submitError}
                </p>
                <button
                  type="button"
                  onClick={() => setPath('whatsapp')}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Use WhatsApp Agent instead →
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleWhatsApp} className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text">
                <Globe className="h-3.5 w-3.5 text-accent" />
                Select Your Country
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {agentCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountryCode(c.code)}
                    className={`relative flex flex-col items-center gap-0.5 rounded border px-1.5 py-2 transition-all ${
                      countryCode === c.code
                        ? 'border-accent bg-accent/10 text-text'
                        : 'border-border bg-navy-dark text-muted hover:border-border/80'
                    }`}
                  >
                    {countryCode === c.code && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-accent" />
                    )}
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="text-center text-[10px] font-medium leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
              {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country}</p>}
              <p className="mt-2 text-[11px] text-accent">
                → Agent for {selectedCountry.flag} {selectedCountry.name}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-text">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                className={inputClass}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-text">
                Phone Number
              </label>
              <div className="flex gap-2">
                <span className="flex shrink-0 items-center rounded border border-border bg-navy-dark px-3 text-sm text-muted">
                  {selectedCountry.dialCode}
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={selectedCountry.phonePlaceholder}
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors"
            >
              <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              Open WhatsApp — {selectedCountry.flag} {selectedCountry.name}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
