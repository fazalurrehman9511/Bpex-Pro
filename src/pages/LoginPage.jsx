import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, MessageCircle, User, UserPlus } from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { verifyBpexchUser } from '../utils/api'
import { setBpexchLoggedIn } from '../utils/bpexchAuth'
import { saveWebLoginCreds } from '../utils/openBpexchExchange'
import { BRAND_LOGO_LG, BRAND_NAME } from '../config/brand'

const inputClass =
  'w-full rounded border border-border bg-navy-dark px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors'

export default function LoginPage() {
  const { openModal } = useModal()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Login — BpxPro'
    return () => {
      document.title = 'BpxPro — Betting Exchange'
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('Username aur password likho')
      return
    }

    setSubmitting(true)
    try {
      await verifyBpexchUser({ username: u, password: p })
      saveWebLoginCreds({ username: u, password: p })
      setBpexchLoggedIn(true)
      /* Stay on bpexpro.com — Home / Deposit / Withdraw. Dashboard → BPEXCH. */
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login fail — pehle register karein ya credentials check karein')
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-border bg-navy-light p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={BRAND_LOGO_LG}
            alt={BRAND_NAME}
            width={80}
            height={80}
            className="h-20 w-20 rounded-2xl object-cover shadow-lg shadow-black/30"
            decoding="async"
          />
          <h1 className="mt-4 text-xl font-bold text-text">Login</h1>
          <p className="mt-1 text-xs text-muted">
            Sign in on BpxPro — URL always{' '}
            <span className="text-accent">bpexpro.com</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-user" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
              <User className="h-3.5 w-3.5 text-accent" />
              Username
            </label>
            <input
              id="login-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              autoComplete="username"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="login-pass" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text">
              <Lock className="h-3.5 w-3.5 text-accent" />
              Password
            </label>
            <div className="relative">
              <input
                id="login-pass"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
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
          </div>

          {error ? (
            <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-2 border-t border-border pt-5">
          <p className="text-center text-xs text-muted">New account?</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openModal('register', { registerPath: 'whatsapp' })}
              className="inline-flex items-center justify-center gap-1.5 rounded border border-border px-3 py-2.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-accent" fill="currentColor" strokeWidth={0} />
              Register via WhatsApp
            </button>
            <button
              type="button"
              onClick={() => openModal('register', { registerPath: 'self' })}
              className="inline-flex items-center justify-center gap-1.5 rounded border border-border px-3 py-2.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5 text-accent" />
              Self Register
            </button>
          </div>
          <p className="pt-1 text-center text-[10px] text-muted/70">
            <Link to="/" className="text-accent hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
