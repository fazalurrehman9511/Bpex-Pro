import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Home, Wallet } from 'lucide-react'
import { setBpexchLoggedIn, isBpexchLoggedIn } from '../utils/bpexchAuth'
import { openBpexchExchange, readWebLoginCreds } from '../utils/openBpexchExchange'

/**
 * /dashboard — opens BPEXCH exchange (leaves site).
 * Home / deposit / withdraw stay on bpexpro.com.
 */
export default function PlatformShellPage() {
  const navigate = useNavigate()
  const loggedIn = isBpexchLoggedIn() || Boolean(readWebLoginCreds())

  useEffect(() => {
    document.title = 'Dashboard — BpxPro'
    if (!loggedIn) {
      navigate('/login', { replace: true })
      return undefined
    }
    setBpexchLoggedIn(true)
    /* Auto-open exchange when user clicks Dashboard */
    const t = window.setTimeout(() => {
      openBpexchExchange()
    }, 400)
    return () => {
      window.clearTimeout(t)
      document.title = 'BpxPro — Betting Exchange'
    }
  }, [loggedIn, navigate])

  if (!loggedIn) return null

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12 text-center">
      <p className="text-sm font-semibold text-text">Opening BPEXCH exchange…</p>
      <p className="mt-2 text-xs text-muted">
        Betting dashboard BPEXCH pe khulta hai. Deposit / Withdraw BpxPro pe rehte hain.
      </p>
      <button
        type="button"
        onClick={() => openBpexchExchange()}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded bg-accent px-5 py-3 text-sm font-bold text-navy-dark hover:bg-accent-hover"
      >
        <ExternalLink className="h-4 w-4" />
        Open Exchange Now
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link to="/" className="inline-flex items-center gap-1 text-accent hover:underline">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <Link to="/deposit" className="inline-flex items-center gap-1 text-accent hover:underline">
          <Wallet className="h-3.5 w-3.5" />
          Deposit
        </Link>
        <Link to="/withdraw" className="text-accent hover:underline">
          Withdraw
        </Link>
      </div>
    </section>
  )
}
