import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, LogIn, User, AlertCircle } from 'lucide-react'
import { verifyBpexchUser } from '../utils/api'
import {
  clearBpexchSession,
  getBpexchPassword,
  getBpexchUsername,
  setBpexchLoggedIn,
  setBpexchPassword,
  setBpexchUsername,
} from '../utils/bpexchAuth'
import { ensureBpexchSession } from '../utils/bpexchSession'
import { BRAND_LOGO_LG, BRAND_NAME } from '../config/brand'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState(() => getBpexchUsername())
  const [password, setPassword] = useState(() => getBpexchPassword())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Login — BpxPro'
  }, [])

  useEffect(() => {
    const urlError = new URLSearchParams(location.search).get('error') || ''
    if (urlError) setError(urlError)
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('Username aur password likhein.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await verifyBpexchUser({ username: u, password: p })
      clearBpexchSession()
      setBpexchUsername(u)
      setBpexchPassword(p)
      setBpexchLoggedIn(true, u)
      void ensureBpexchSession({ username: u, password: p, force: true }).catch(() => false)
      try {
        sessionStorage.removeItem('flowexch_post_login_redirect')
        sessionStorage.removeItem('flowexch_flash_message')
      } catch {
        /* ignore */
      }
      navigate('/', { replace: true })
    } catch (err) {
      clearBpexchSession()
      setError(err.message || "User doesn't exist in our database.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[radial-gradient(circle_at_top,#123f2b_0%,#0f1923_55%,#091117_100%)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-navy-dark/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={BRAND_LOGO_LG}
            alt={BRAND_NAME}
            width={88}
            height={88}
            className="h-22 w-22 rounded-[24px] object-cover shadow-lg shadow-black/30"
            decoding="async"
          />
          <h1 className="mt-4 text-2xl font-black text-white">{BRAND_NAME} Login</h1>
          <p className="mt-2 text-sm text-white/60">
            Ek dafa yahan login karo. Dashboard par BPEXCH auto-login ho jayega.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/55">
              Username
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 focus-within:border-accent/50">
              <User className="h-4 w-4 shrink-0 text-accent" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/55">
              Password
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 focus-within:border-accent/50">
              <Lock className="h-4 w-4 shrink-0 text-accent" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
          </label>

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-center text-sm text-white/65">
          New user?{' '}
          <Link to="/" className="font-bold text-accent hover:underline">
            Home par ja kar registration karein
          </Link>
        </div>
      </div>
    </div>
  )
}
