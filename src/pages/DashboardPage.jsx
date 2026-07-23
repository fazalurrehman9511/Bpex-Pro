import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  getBpexchUsername,
  isBpexchLoggedIn,
} from '../utils/bpexchAuth'
import { BPEXCH_LOGIN_EXTERNAL_URL, openBpexchLoginInNewTab } from '../utils/bpexchExternal'

export default function DashboardPage() {
  const loggedIn = isBpexchLoggedIn()
  const username = getBpexchUsername()
  const [popupBlocked, setPopupBlocked] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard — BpxPro'
  }, [])

  useEffect(() => {
    if (!loggedIn || !username) return
    setPopupBlocked(false)
    const opened = openBpexchLoginInNewTab()
    if (opened) {
      window.location.replace('/')
      return
    }
    setPopupBlocked(true)
  }, [loggedIn, username])

  if (!loggedIn || !username) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.12)_0%,_rgba(15,25,35,0.96)_58%,_rgba(9,17,23,1)_100%)] px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/10 bg-navy-dark/90 px-6 py-7 text-center shadow-2xl backdrop-blur">
        {popupBlocked ? (
          <>
            <p className="text-sm font-bold text-text">Open BPEXCH Login</p>
            <p className="text-xs text-muted">
              Your browser blocked the new tab. Use the button below to continue.
            </p>
            <a
              href={BPEXCH_LOGIN_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (openBpexchLoginInNewTab()) {
                  e.preventDefault()
                }
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-navy-dark transition-colors hover:bg-accent-hover"
            >
              Open in New Tab
            </a>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-bold text-text">Opening BPEXCH Login...</p>
            <p className="text-xs text-muted">
              Please wait, a new tab is opening for BPEXCH.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
