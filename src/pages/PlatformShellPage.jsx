import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Home, Loader2, Wallet } from 'lucide-react'
import PlatformEmbedPage from './PlatformEmbedPage'
import { setBpexchLoggedIn, isBpexchLoggedIn } from '../utils/bpexchAuth'
import { openBpexchExchange, readWebLoginCreds } from '../utils/openBpexchExchange'
import { BPEXCH_BASE_URL } from '../config/embed'

/**
 * Betting dashboard — browser URL stays https://bpexpro.com/dashboard
 */
export default function PlatformShellPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [useEmbed, setUseEmbed] = useState(true)
  const loggedIn = isBpexchLoggedIn() || Boolean(readWebLoginCreds())

  useEffect(() => {
    if (!loggedIn) {
      navigate('/login', { replace: true })
      return undefined
    }
    setBpexchLoggedIn(true)
    setReady(true)

    /* Probe same-origin proxy — if dead, show local shell (not blank iframe) */
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/bpexch/Users/Login', {
          method: 'HEAD',
          credentials: 'include',
        })
        if (cancelled) return
        /* 503 friendly page still "works" as HTML; HEAD may not — also try GET snip */
        if (res.status >= 500) {
          setUseEmbed(false)
          return
        }
      } catch {
        if (!cancelled) setUseEmbed(false)
      }

      const creds = readWebLoginCreds()
      if (!creds?.username || !creds?.password || cancelled) return

      window.setTimeout(() => {
        if (cancelled) return
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = '/bpexch/Users/Login'
        form.target = 'flowexch-platform'
        form.acceptCharset = 'UTF-8'
        form.style.display = 'none'
        const fields = {
          'user.Username': creds.username,
          'user.Password': creds.password,
          Device: 'BpxPro-Web',
          UtcOffset: String(-new Date().getTimezoneOffset()),
        }
        for (const [name, value] of Object.entries(fields)) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = name
          input.value = value
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        form.remove()
      }, 500)
    })()

    return () => {
      cancelled = true
    }
  }, [loggedIn, navigate])

  if (!loggedIn || !ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-navy px-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Loading dashboard…</p>
      </div>
    )
  }

  if (!useEmbed) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-xl border border-border bg-navy-light p-6 text-center shadow-xl">
          <h1 className="text-lg font-bold text-text">Dashboard</h1>
          <p className="mt-2 text-xs text-muted">
            URL: <span className="text-accent">bpexpro.com/dashboard</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            In-site exchange embed abhi hosting Cloudflare / proxy block ki wajah se available nahi.
            Deposit &amp; Withdraw BpxPro pe use karein, ya exchange alag tab mein kholo.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/deposit"
              className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-3 text-sm font-bold text-navy-dark"
            >
              <Wallet className="h-4 w-4" />
              Deposit
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center justify-center gap-2 rounded border border-border px-4 py-3 text-sm font-semibold text-text"
            >
              Withdraw
            </Link>
            <button
              type="button"
              onClick={() => openBpexchExchange()}
              className="inline-flex items-center justify-center gap-2 rounded border border-accent/40 px-4 py-3 text-sm font-semibold text-accent"
            >
              <ExternalLink className="h-4 w-4" />
              Open Exchange ({BPEXCH_BASE_URL.replace(/^https?:\/\//, '')})
            </button>
            <Link to="/" className="inline-flex items-center justify-center gap-1 pt-2 text-xs text-accent">
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <PlatformEmbedPage
      src="/bpexch/Common/Dashboard"
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
      syncPublicUrl
    />
  )
}
