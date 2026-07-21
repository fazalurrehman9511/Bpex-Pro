import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import PlatformEmbedPage from './PlatformEmbedPage'
import { BPEXCH_DASHBOARD_URL, BPEXCH_LOGIN_URL } from '../config/embed'
import {
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

  useEffect(() => {
    document.title = 'Dashboard — BpxPro'
  }, [])

  if (!loggedIn || !username || !password) {
    return <Navigate to="/login" replace />
  }

  return (
    <PlatformEmbedPage
      src={hasAuthToken ? BPEXCH_DASHBOARD_URL : BPEXCH_LOGIN_URL}
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
      autoLoginCredentials={hasAuthToken ? null : { username, password }}
      loadingMessage={hasAuthToken ? 'Opening Dashboard...' : 'Signing in to Dashboard...'}
    />
  )
}
