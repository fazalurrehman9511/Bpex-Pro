import {
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  ArrowUpFromLine,
  LogOut,
  ChevronDown,
  MessageCircle,
  UserPlus,
  Copy,
  Lock,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { navigateToSection } from '../utils/detectCountry'
import {
  isBpexchLoggedIn,
  subscribeBpexchAuth,
  getBpexchUsername,
  getBpexchPassword,
  subscribeBpexchUsername,
  subscribeBpexchPassword,
  clearBpexchSession,
  setBpexchUsername,
  usernameFromAuthToken,
} from '../utils/bpexchAuth'
import {
  getEmbedAvailableBalance,
  setEmbedAvailableBalance,
  subscribeEmbedBalance,
} from '../utils/embedBalance'
import { fetchBpexchBalance } from '../utils/api'
import {
  formatCurrency,
  parseBalanceAmount,
} from '../utils/transactions'
import { BRAND_LOGO, BRAND_NAME } from '../config/brand'

export default function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
      aria-label={BRAND_NAME}
    >
      <img
        src={BRAND_LOGO}
        alt={BRAND_NAME}
        width={72}
        height={72}
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  )
}

const navLinks = [
  { label: 'Events', id: 'events' },
  { label: 'Deposit', id: 'payments' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact', id: 'contact' },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
]

function formatBalanceLabel(raw) {
  if (raw == null || raw === '') return ''
  const n = parseBalanceAmount(raw)
  if (n == null || Number.isNaN(n)) {
    const s = String(raw).trim()
    return s || ''
  }
  return formatCurrency(n)
}

function ProfileMenu({
  username,
  password,
  balanceLabel,
  balanceLoading,
  onLogout,
  onRefreshBalance,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const display = username || 'User'
  const initial = display.charAt(0).toUpperCase()
  const balText = balanceLoading && !balanceLabel ? '…' : balanceLabel || '—'
  const passText = String(password || '').trim() || '—'

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) onRefreshBalance?.()
  }, [open, onRefreshBalance])

  const itemClass =
    'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-text transition-colors hover:bg-navy-light'

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-navy-light pl-1 pr-2 text-left transition-colors sm:h-11 sm:gap-2.5 sm:pl-1.5 sm:pr-2.5 ${
          open
            ? 'border-accent/50'
            : 'border-border hover:border-accent/35'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-navy-dark sm:h-8 sm:w-8 sm:text-sm">
          {initial}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-[8.5rem] truncate text-xs font-semibold text-text">
            {display}
          </span>
          <span className="block max-w-[8.5rem] truncate text-[11px] font-semibold text-accent">
            {balText}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-56 overflow-hidden rounded-lg border border-border bg-navy-dark shadow-xl ring-1 ring-black/20"
        >
          <div className="border-b border-border px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-text">{display}</p>
            <p className="mt-0.5 text-xs text-muted">
              Available{' '}
              <span className="font-semibold text-accent">{balText}</span>
            </p>
            <div className="mt-3 rounded-md border border-border bg-navy-light/70 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted">Password</p>
                  <p className="truncate text-xs font-semibold text-text">{passText}</p>
                </div>
                {password ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(password)
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded p-1 text-muted transition-colors hover:text-accent"
                    aria-label="Copy password"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link to="/dashboard" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <LayoutDashboard className="h-4 w-4 text-muted" />
              Dashboard
            </Link>
            <Link to="/deposit" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Wallet className="h-4 w-4 text-muted" />
              Deposit
            </Link>
            <Link to="/withdraw" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <ArrowUpFromLine className="h-4 w-4 text-muted" />
              Withdraw
            </Link>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border px-3.5 py-2.5 text-left text-[13px] font-medium text-red-300 transition-colors hover:bg-navy-light"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export function HeaderBar() {
  const { openModal } = useModal()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())
  const [username, setUsername] = useState(() => getBpexchUsername())
  const [savedPassword, setSavedPassword] = useState(() => getBpexchPassword())
  const [balanceRaw, setBalanceRaw] = useState(() => getEmbedAvailableBalance())
  const [balanceLoading, setBalanceLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])
  useEffect(() => subscribeBpexchUsername(setUsername), [])
  useEffect(() => subscribeBpexchPassword(setSavedPassword), [])
  useEffect(() => subscribeEmbedBalance(setBalanceRaw), [])

  useEffect(() => {
    if (!getBpexchUsername()) {
      const fromToken = usernameFromAuthToken()
      if (fromToken) setBpexchUsername(fromToken)
    }
    setUsername(getBpexchUsername())
  }, [loggedIn, location.pathname])

  const loadBalance = useCallback(async () => {
    const u = getBpexchUsername() || username
    if (!u || !loggedIn) return
    setBalanceLoading(true)
    try {
      const data = await fetchBpexchBalance(u)
      const next =
        data?.balance != null
          ? String(data.balance)
          : data?.maxWithdraw != null
            ? String(data.maxWithdraw)
            : ''
      if (next !== '') {
        setEmbedAvailableBalance(next)
        setBalanceRaw(next)
      }
    } catch {
      /* keep cached embed balance */
    } finally {
      setBalanceLoading(false)
    }
  }, [loggedIn, username])

  useEffect(() => {
    if (!loggedIn) {
      setBalanceRaw('')
      return undefined
    }
    loadBalance()
    const tick = setInterval(loadBalance, 60_000)
    return () => clearInterval(tick)
  }, [loggedIn, username, loadBalance])

  const handleNav = (id) => {
    navigateToSection(id, navigate, location.pathname)
    setMenuOpen(false)
  }

  const handleLogout = () => {
    clearBpexchSession()
    setLoggedIn(false)
    setUsername('')
    setBalanceRaw('')
    setMenuOpen(false)
    // Fire-and-forget — do not wait (keeps logout instant)
    try {
      fetch('/bpexch/Common/Logout', {
        credentials: 'include',
        redirect: 'manual',
        keepalive: true,
      }).catch(() => {})
    } catch {
      /* ignore */
    }
    navigate('/', { replace: true })
  }

  const isActive = (path) => location.pathname === path
  const balanceLabel = formatBalanceLabel(balanceRaw)

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-navy-dark/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2 sm:gap-4 sm:px-5">
        <div className="shrink-0">
          <Logo />
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
          {navLinks.map(({ label, id, to, icon: Icon }) =>
            to ? (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors lg:px-3 ${
                  isActive(to)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-navy-light hover:text-text'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className="cursor-pointer rounded px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-navy-light hover:text-text lg:px-3"
              >
                {label}
              </button>
            )
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {loggedIn ? (
            <>
              <Link
                to="/deposit"
                className={`hidden cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors sm:inline-flex ${
                  isActive('/deposit')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text hover:border-accent/40'
                }`}
              >
                <Wallet className="h-3.5 w-3.5 text-accent" />
                <span className="hidden lg:inline">Deposit</span>
              </Link>
              <Link
                to="/withdraw"
                className={`hidden cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors sm:inline-flex ${
                  isActive('/withdraw')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text hover:border-accent/40'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-accent" />
                <span className="hidden lg:inline">Withdraw</span>
              </Link>
              <ProfileMenu
                username={username}
                password={savedPassword}
                balanceLabel={balanceLabel}
                balanceLoading={balanceLoading}
                onLogout={handleLogout}
                onRefreshBalance={loadBalance}
              />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`hidden cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:inline-flex ${
                  isActive('/login')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text hover:border-accent/40'
                }`}
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="hidden cursor-pointer items-center gap-1 rounded-lg bg-accent px-2.5 py-2 text-xs font-bold text-navy-dark transition-colors hover:bg-accent-hover sm:inline-flex sm:px-3"
              >
                <MessageCircle className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                Agent
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="hidden cursor-pointer items-center gap-1 rounded-lg border border-border bg-navy-light px-2.5 py-2 text-xs font-bold text-text transition-colors hover:border-accent/40 sm:inline-flex sm:px-3"
              >
                <UserPlus className="h-3.5 w-3.5 text-accent" />
                Myself
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="cursor-pointer rounded p-1.5 text-muted hover:text-text md:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-navy-dark px-4 py-3 md:hidden">
          {navLinks.map(({ label, id, to, icon: Icon }) =>
            to ? (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-muted hover:bg-navy-light hover:text-text"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className="block w-full cursor-pointer rounded px-3 py-2.5 text-left text-sm font-medium text-muted hover:bg-navy-light hover:text-text"
              >
                {label}
              </button>
            )
          )}
          {loggedIn ? (
            <>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-base font-bold text-navy-dark">
                  {(username || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-accent">{username || 'User'}</p>
                  <p className="text-xs font-semibold text-text">{balanceLabel || '—'}</p>
                  <p className="truncate text-[11px] text-muted">Pass: {savedPassword || '—'}</p>
                </div>
              </div>
              <Link
                to="/deposit"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
              >
                <Wallet className="h-4 w-4 text-accent" />
                Deposit
              </Link>
              <Link
                to="/withdraw"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
              >
                <ArrowUpFromLine className="h-4 w-4 text-accent" />
                Withdraw
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded border border-red-500/30 px-3 py-2.5 text-left text-sm font-semibold text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-1 block w-full rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openModal('register', { registerPath: 'whatsapp' })
                }}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded bg-accent px-3 py-2.5 text-left text-sm font-bold text-navy-dark"
              >
                <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                Register with Agent
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openModal('register', { registerPath: 'self' })
                }}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded border border-border px-3 py-2.5 text-left text-sm font-semibold text-text"
              >
                <UserPlus className="h-4 w-4 text-accent" />
                Register Myself
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
