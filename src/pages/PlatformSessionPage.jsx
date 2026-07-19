import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import PlatformEmbedPage from './PlatformEmbedPage'
import { BPEXCH_LOGIN_URL, BPEXCH_DASHBOARD_URL } from '../config/embed'
import { setBpexchLoggedIn } from '../utils/bpexchAuth'

/**
 * Shared layout for /login + /dashboard so the BPEXCH iframe is NOT remounted
 * after login (biggest speed win — avoids a second residential-proxy page load).
 */
export default function PlatformSessionPage() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  const initialSrcRef = useRef(
    location.pathname === '/login' ? BPEXCH_LOGIN_URL : BPEXCH_DASHBOARD_URL,
  )

  useEffect(() => {
    document.title = isLogin ? 'Login — BpxPro' : 'Dashboard — BpxPro'
    if (!isLogin) setBpexchLoggedIn(true)
  }, [isLogin])

  return (
    <>
      <PlatformEmbedPage
        src={initialSrcRef.current}
        title={isLogin ? 'Login' : 'Dashboard'}
        pageTitle={isLogin ? 'Login — BpxPro' : 'Dashboard — BpxPro'}
        syncPublicUrl
        listenForActions
        redirectOnLogin={false}
      />
      <Outlet />
    </>
  )
}
