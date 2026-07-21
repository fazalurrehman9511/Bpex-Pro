import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { setEmbedAvailableBalance, NARROW_BREAKPOINT } from '../utils/embedBalance'
import {
  setBpexchLoggedIn,
  setBpexchUsername,
  clearBpexchSession,
  getBpexchUsername,
} from '../utils/bpexchAuth'
import { verifyBpexchUser } from '../utils/api'
import {
  normalizePublicPath,
  shouldSyncPublicPath,
} from '../utils/platformPaths'

const POST_LOGIN_REDIRECT_KEY = 'flowexch_post_login_redirect'

const DASHBOARD_PATHS = [
  '/bpexch/Common/Dashboard',
  '/bpexch/Home',
  '/bpexch/home',
  '/bpexch/Dashboard',
  '/bpexch/',
]

function EmbedActionBar({ top, height, narrow, onNavigate }) {
  return (
    <div
      className={`flowexch-embed-actions${narrow ? ' flowexch-embed-actions-narrow' : ''}`}
      style={{ top, height }}
      aria-label="Quick actions"
    >
      <button
        type="button"
        className="flowexch-embed-btn flowexch-embed-btn-home"
        onClick={() => onNavigate('/')}
      >
        Home
      </button>
      <button
        type="button"
        className="flowexch-embed-btn flowexch-embed-btn-deposit"
        onClick={() => onNavigate('/deposit')}
      >
        Deposit
      </button>
      <button
        type="button"
        className="flowexch-embed-btn flowexch-embed-btn-withdraw"
        onClick={() => onNavigate('/withdraw')}
      >
        Withdraw
      </button>
    </div>
  )
}

export default function EmbedFrame({
  src,
  title = 'Platform',
  redirectOnLogin = false,
  listenForActions = false,
  syncPublicUrl = false,
}) {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [key, setKey] = useState(0)
  const [actionAnchor, setActionAnchor] = useState(null)
  const [narrow, setNarrow] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const iframeRef = useRef(null)
  const verifiedUsernameRef = useRef('')
  const checkingUsernameRef = useRef('')
  const publicPathRef = useRef(location.pathname)

  const captureBalanceFromIframe = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document
      const bal = doc?.querySelector('.wallet-balance,.header .wallet-balance')
      const text = (bal?.textContent || '').trim()
      if (text) setEmbedAvailableBalance(text)
    } catch {
      /* ignore */
    }
  }, [])

  const handleEmbedNavigate = useCallback(
    (path) => {
      captureBalanceFromIframe()
      navigate(path)
    },
    [captureBalanceFromIframe, navigate]
  )

  const postViewportToIframe = () => {
    const isNarrow = window.innerWidth <= NARROW_BREAKPOINT
    setNarrow(isNarrow)
    if (!iframeRef.current?.contentWindow) return
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          source: 'flowexch-parent',
          narrow: isNarrow,
        },
        window.location.origin
      )
    } catch {
      /* ignore */
    }
  }

  const syncUrlFromIframe = () => {
    if (!syncPublicUrl || !iframeRef.current?.contentWindow) return
    try {
      const frameLoc = iframeRef.current.contentWindow.location
      if (!shouldSyncPublicPath(frameLoc.pathname)) return
      const publicPath = normalizePublicPath(frameLoc.pathname, frameLoc.search)
      const current = `${location.pathname}${location.search}`
      if (publicPath !== current) {
        navigate(publicPath, { replace: true })
      }
    } catch {
      /* ignore */
    }
  }

  const redirectToLoginWithError = useCallback((message) => {
    verifiedUsernameRef.current = ''
    checkingUsernameRef.current = ''
    publicPathRef.current = '/login'
    clearBpexchSession()
    setBpexchUsername('')
    setBpexchLoggedIn(false)
    setEmbedAvailableBalance('')
    const params = new URLSearchParams()
    params.set(
      'error',
      String(message || "User doesn't exist in our database. Please register first."),
    )
    window.location.replace(`/login?${params.toString()}`)
  }, [])

  const confirmLocalUserAccess = useCallback(
    async (candidate, { goDashboard = false } = {}) => {
      const username = String(candidate || getBpexchUsername()).trim()
      if (!username) return false

      const key = username.toLowerCase()
      if (verifiedUsernameRef.current === key) {
        setBpexchUsername(username)
        setBpexchLoggedIn(true, username)
        if (goDashboard && location.pathname !== '/dashboard') {
          navigate('/dashboard', { replace: true })
        }
        return true
      }

      if (checkingUsernameRef.current === key) return false
      checkingUsernameRef.current = key

      try {
        await verifyBpexchUser({ username })
        verifiedUsernameRef.current = key
        setBpexchUsername(username)
        setBpexchLoggedIn(true, username)
        let redirectHome = false
        try {
          redirectHome = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) === 'home'
          if (redirectHome) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
        } catch {
          /* ignore */
        }
        if (redirectHome) {
          navigate('/', { replace: true })
          return true
        }
        if (goDashboard && location.pathname !== '/dashboard') {
          navigate('/dashboard', { replace: true })
        }
        return true
      } catch (err) {
        redirectToLoginWithError(
          err?.message || "User doesn't exist in our database. Please register first.",
        )
        return false
      } finally {
        if (checkingUsernameRef.current === key) checkingUsernameRef.current = ''
      }
    },
    [location.pathname, navigate, redirectToLoginWithError],
  )

  const handleLoad = () => {
    setLoading(false)
    postViewportToIframe()
    syncUrlFromIframe()

    if (!redirectOnLogin || !iframeRef.current) return

    try {
      const path = iframeRef.current.contentWindow?.location?.pathname || ''
      const isDashboard = DASHBOARD_PATHS.some(
        (p) => path === p || path.startsWith('/bpexch/Common/') || path.startsWith('/bpexch/Home')
      )
      if (isDashboard && !path.includes('/Users/Login')) {
        publicPathRef.current = '/dashboard'
        void confirmLocalUserAccess(getBpexchUsername(), { goDashboard: true })
      } else if (path.includes('/Users/Login') || path.includes('/login')) {
        publicPathRef.current = '/login'
        verifiedUsernameRef.current = ''
        setBpexchLoggedIn(false)
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setLoading(true)
    setActionAnchor(null)
    // Don't hold a full-screen blocker forever — show iframe as soon as possible
    const maxWait = window.setTimeout(() => setLoading(false), 1200)
    return () => window.clearTimeout(maxWait)
  }, [src, key])

  useEffect(() => {
    if (!listenForActions && !syncPublicUrl && !redirectOnLogin) return undefined

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return
      const data = event.data || {}
      const { source, action, path, availableBalance } = data
      if (source !== 'flowexch-embed') return

      if (action === 'actionbar-anchor' && listenForActions) {
        if (!data.visible) {
          setActionAnchor((prev) => (prev?.visible ? { ...prev, visible: false } : prev))
          return
        }
        const next = {
          top: data.top,
          height: data.height || 28,
          visible: true,
        }
        setActionAnchor((prev) => {
          if (
            prev &&
            prev.visible === next.visible &&
            Math.abs((prev.top || 0) - next.top) < 1 &&
            Math.abs((prev.height || 0) - next.height) < 1
          ) {
            return prev
          }
          return next
        })
        return
      }

      if (action === 'auth-username' && data.username) {
        const u = String(data.username || '').trim()
        if (u) {
          setBpexchUsername(u)
          if (publicPathRef.current === '/dashboard' || location.pathname === '/dashboard') {
            void confirmLocalUserAccess(u, { goDashboard: true })
          }
        }
        return
      }

      if (action === 'auth-logout') {
        verifiedUsernameRef.current = ''
        checkingUsernameRef.current = ''
        publicPathRef.current = '/login'
        clearBpexchSession()
        setBpexchUsername('')
        setBpexchLoggedIn(false)
        setEmbedAvailableBalance('')
        navigate('/', { replace: true })
        return
      }

      if (action === 'embed-path' && path) {
        const raw = String(path)
        const q = raw.indexOf('?')
        const pathPart = q >= 0 ? raw.slice(0, q) : raw
        const search = q >= 0 ? raw.slice(q) : ''
        const full = normalizePublicPath(pathPart, search)
        publicPathRef.current = full
        const onLogin = full === '/login' || /\/Users\/Login|\/login/i.test(pathPart)
        if (onLogin) {
          verifiedUsernameRef.current = ''
          setBpexchLoggedIn(false)
        } else if (full === '/dashboard' || /Dashboard|Home|Common/i.test(pathPart)) {
          void confirmLocalUserAccess(getBpexchUsername(), { goDashboard: false })
        }
        if (syncPublicUrl || redirectOnLogin) {
          const allowed = full === '/dashboard' || full === '/login'
          if (!allowed) return
          if (`${location.pathname}${location.search}` !== full) {
            navigate(full, { replace: true })
          }
        }
        return
      }

      if (action === 'navigate' && path) {
        if (availableBalance) setEmbedAvailableBalance(availableBalance)
        navigate(path)
        return
      }

      if (action === 'deposit') {
        if (availableBalance) setEmbedAvailableBalance(availableBalance)
        navigate('/deposit')
      }
      if (action === 'withdraw') {
        if (availableBalance) setEmbedAvailableBalance(availableBalance)
        navigate('/withdraw')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [
    confirmLocalUserAccess,
    listenForActions,
    syncPublicUrl,
    redirectOnLogin,
    navigate,
    location.pathname,
    location.search,
  ])

  useEffect(() => {
    publicPathRef.current = location.pathname
    if (location.pathname === '/login') {
      verifiedUsernameRef.current = ''
      return
    }
    if (location.pathname === '/dashboard') {
      void confirmLocalUserAccess(getBpexchUsername())
    }
  }, [confirmLocalUserAccess, location.pathname])

  useEffect(() => {
    if (!listenForActions) return undefined

    postViewportToIframe()
    window.addEventListener('resize', postViewportToIframe)

    const poll = window.setInterval(postViewportToIframe, 400)

    return () => {
      window.removeEventListener('resize', postViewportToIframe)
      window.clearInterval(poll)
    }
  }, [listenForActions, loading])

  useEffect(() => {
    if (!syncPublicUrl) return undefined
    const poll = window.setInterval(syncUrlFromIframe, 400)
    return () => window.clearInterval(poll)
  }, [syncPublicUrl, src])

  const showActionBar =
    listenForActions &&
    !loading &&
    !failed &&
    actionAnchor?.visible

  return (
    <div className="fixed inset-0 flex flex-col bg-[#1a1a1a]">
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-navy/70">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <p className="text-xs text-muted">Loading {title}…</p>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-navy px-6 text-center">
          <AlertCircle className="h-10 w-10 text-accent" />
          <p className="text-sm font-semibold text-text">Unable to load {title}</p>
          <button
            onClick={() => { setFailed(false); setLoading(true); setKey((k) => k + 1) }}
            className="mt-2 rounded bg-accent px-5 py-2 text-xs font-bold text-navy-dark"
          >
            Retry
          </button>
        </div>
      )}

      {showActionBar && (
        <EmbedActionBar
          top={actionAnchor.top}
          height={actionAnchor.height}
          narrow={narrow}
          onNavigate={handleEmbedNavigate}
        />
      )}

      <iframe
        ref={iframeRef}
        key={key}
        src={src}
        title={title}
        name="flowexch-platform"
        className="flex-1 w-full h-full border-0"
        onLoad={handleLoad}
        onError={() => { setLoading(false); setFailed(true) }}
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen; clipboard-read; clipboard-write"
      />
    </div>
  )
}
