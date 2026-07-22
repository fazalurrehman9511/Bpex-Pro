import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import PlatformEmbedPage from './PlatformEmbedPage'
import { BPEXCH_DASHBOARD_URL } from '../config/embed'
import {
  getBpexchAuthToken,
  getBpexchPassword,
  getBpexchUsername,
  isBpexchLoggedIn,
} from '../utils/bpexchAuth'
import { ensureBpexchSession } from '../utils/bpexchSession'

export default function DashboardPage() {
  const loggedIn = isBpexchLoggedIn()
  const username = getBpexchUsername()
  const password = getBpexchPassword()
  const hasAuthToken = Boolean(getBpexchAuthToken())
  const [sessionPrimed, setSessionPrimed] = useState(() => hasAuthToken)
  const [preparingSession, setPreparingSession] = useState(() => !hasAuthToken)

  useEffect(() => {
    document.title = 'Dashboard — BpxPro'
  }, [])

  useEffect(() => {
    let cancelled = false

    if (hasAuthToken) {
      setSessionPrimed(true)
      setPreparingSession(false)
      return () => {
        cancelled = true
      }
    }

    setSessionPrimed(false)
    setPreparingSession(true)

    ensureBpexchSession({ username, password })
      .then((ok) => {
        if (!cancelled) setSessionPrimed(Boolean(ok))
      })
      .catch(() => {
        if (!cancelled) setSessionPrimed(false)
      })
      .finally(() => {
        if (!cancelled) setPreparingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasAuthToken, username, password])

  if (!loggedIn || !username || !password) {
    return <Navigate to="/login" replace />
  }

  return (
    <PlatformEmbedPage
      src={BPEXCH_DASHBOARD_URL}
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
      autoLoginCredentials={{ username, password }}
      loadingMessage={
        preparingSession
          ? 'Connecting to Dashboard...'
          : hasAuthToken || sessionPrimed
            ? 'Opening Dashboard...'
            : 'Signing in to Dashboard...'
      }
    />
  )
}
