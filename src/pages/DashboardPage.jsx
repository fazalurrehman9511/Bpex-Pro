import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { openBpexchWithAppLogin } from '../mobile/bpexchAutoLogin'
import PlatformEmbedPage from './PlatformEmbedPage'
import { BPEXCH_DASHBOARD_URL } from '../config/embed'
import {
  clearBpexchSession,
  getBpexchAuthToken,
  getBpexchPassword,
  getBpexchUsername,
  isBpexchLoggedIn,
} from '../utils/bpexchAuth'

export default function DashboardPage() {
  const loggedIn = isBpexchLoggedIn()
  const username = getBpexchUsername()
  const password = getBpexchPassword()
  const hasAuthToken = Boolean(getBpexchAuthToken())
  const [bootState, setBootState] = useState(() => {
    if (!loggedIn || !username || !password) return 'missing'
    return hasAuthToken ? 'ready' : 'booting'
  })
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    document.title = 'Dashboard — BpxPro'
  }, [])

  useEffect(() => {
    if (!loggedIn || !username || !password || hasAuthToken) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      openBpexchWithAppLogin({ username, password })
        .then(() => {
          if (!cancelled) setBootState('ready')
        })
        .catch((err) => {
          if (cancelled) return
          clearBpexchSession()
          setBootError(err.message || 'Auto login failed. Please login again.')
          setBootState('failed')
        })
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [hasAuthToken, loggedIn, password, username])

  if (!loggedIn || !username || !password || bootState === 'missing') {
    return <Navigate to="/login" replace />
  }

  if (bootState === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/25 bg-navy-dark/95 p-6 text-center shadow-2xl">
          <AlertCircle className="mx-auto h-10 w-10 text-red-300" />
          <h1 className="mt-4 text-xl font-bold text-white">Dashboard login failed</h1>
          <p className="mt-2 text-sm text-red-100/90">{bootError || 'Please login again.'}</p>
          <a
            href="/login"
            className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-navy-dark"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  if (bootState === 'booting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-navy-dark/95 p-6 text-center shadow-2xl">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <h1 className="mt-4 text-xl font-bold text-white">Opening Dashboard</h1>
          <p className="mt-2 text-sm text-white/65">
            BPEXCH par auto-login ho raha hai. Dobara login karne ki zarurat nahi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PlatformEmbedPage
      src={BPEXCH_DASHBOARD_URL}
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
    />
  )
}
