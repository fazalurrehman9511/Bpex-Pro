import {
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  ArrowUpFromLine,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { navigateToSection } from '../utils/detectCountry'
import {
  isBpexchLoggedIn,
  subscribeBpexchAuth,
  getBpexchUsername,
  subscribeBpexchUsername,
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
        alt="BPX"
        width={72}
        height={72}
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
        decoding="async"
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

function ProfileMenu({ username, balanceLabel, balanceLoading, onLogout, onRefreshBalance }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const display = username || 'User'
  const initial = display.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
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

  const menu = open
    ? createPortal(
        <div className="fixed inset-0 z-[80]" role="presentation">
          <button
            type="button"
            aria-label="Close profile menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Profile"
            className="absolute right-3 top-[3.75rem] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-navy-dark shadow-2xl sm:right-6"
          >
            <div className="flex items-start gap-3 border-b border-border bg-navy-light/40 px-4 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-navy-dark">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Signed in
                </p>
                <p className="truncate text-base font-bold text-accent">{display}</p>
                <p className="mt-1 text-sm text-text">
                  <span className="text-muted">Balance:</span>{' '}
                  <span className="font-semibold text-accent">
                    {balanceLoading && !balanceLabel ? 'Loading…' : balanceLabel || '—'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted hover:bg-navy-light hover:text-text"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text hover:bg-navy-light"
              >
                <LayoutDashboard className="h-4 w-4 text-accent" />
                Dashboard
              </Link>
              <Link
                to="/deposit"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text hover:bg-navy-light"
              >
                <Wallet className="h-4 w-4 text-accent" />
                Deposit
              </Link>
              <Link
                to="/withdraw"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text hover:bg-navy-light"
              >
                <ArrowUpFromLine className="h-4 w-4 text-accent" />
                Withdraw
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3.5 text-left text-sm font-semibold text-red-300 hover:bg-navy-light"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <div className="flex items-center gap-2">
        {balanceLabel ? (
          <div className="hidden items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 sm:flex">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Bal
            </span>
            <span className="ml-1.5 text-xs font-bold text-accent">{balanceLabel}</span>
          </div>
        ) : null}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-navy-light p-0.5 pr-2 text-text transition-colors hover:border-accent/50"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Open profile"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-base font-bold text-navy-dark sm:h-12 sm:w-12 sm:text-lg">
            {initial}
          </span>
          <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-text md:inline">
            {display}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {menu}
    </>
  )
}

export function HeaderBar() {
  const { openModal } = useModal()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())
  const [username, setUsername] = useState(() => getBpexchUsername())
  const [balanceRaw, setBalanceRaw] = useState(() => getEmbedAvailableBalance())
  const [balanceLoading, setBalanceLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])
  useEffect(() => subscribeBpexchUsername(setUsername), [])
  useEffect(() => subscribeEmbedBalance(setBalanceRaw), [])

  useEffect(() => {
    if (!getBpexchUsername()) {
      const fromToken = usernameFromAuthToken()
      if (fromToken) setBpexchUsername(fromToken)
    }
    setUsername(getBpexchUsername())
  }, [loggedIn, location.pathname])

  useEffect(() => {
    if (
      location.pathname === '/dashboard' ||
      location.pathname === '/deposit' ||
      location.pathname === '/withdraw'
    ) {
      setLoggedIn(true)
    }
  }, [location.pathname])

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
    try {
      fetch('/bpexch/Common/Logout', { credentials: 'include', redirect: 'manual' }).catch(() => {})
    } catch {
      /* ignore */
    }
    navigate('/login', { replace: true })
  }

  const isActive = (path) => location.pathname === path
  const balanceLabel = formatBalanceLabel(balanceRaw)

  return (
    <header className="sticky top-0 z-40 bg-navy-dark/95 border-b border-border/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map(({ label, id, to, icon: Icon }) =>
            to ? (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive(to)
                    ? 'text-accent bg-accent/10'
                    : 'text-muted hover:text-text hover:bg-navy-light'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </Link>
            ) : (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className="rounded px-3 py-1.5 text-xs font-medium text-muted hover:text-text hover:bg-navy-light transition-colors"
              >
                {label}
              </button>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Link
                to="/deposit"
                className={`hidden lg:inline-flex items-center gap-1.5 rounded border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  isActive('/deposit')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-navy-light text-text hover:border-accent/40'
                }`}
              >
                <Wallet className="h-3.5 w-3.5 text-accent" />
                Deposit
              </Link>
              <Link
                to="/withdraw"
                className={`hidden lg:inline-flex items-center gap-1.5 rounded border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  isActive('/withdraw')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-navy-light text-text hover:border-accent/40'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-accent" />
                Withdraw
              </Link>
              <ProfileMenu
                username={username}
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
                className={`hidden sm:block rounded border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  isActive('/login')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text hover:border-accent/40'
                }`}
              >
                Login
              </Link>
              <button
                onClick={() => openModal('register')}
                className="rounded bg-accent px-3.5 py-1.5 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors sm:px-4"
              >
                Register
              </button>
            </>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded p-1.5 text-muted hover:text-text sm:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-navy-dark px-4 py-3 sm:hidden">
          {navLinks.map(({ label, id, to, icon: Icon }) =>
            to ? (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 w-full rounded px-3 py-2.5 text-sm font-medium text-muted hover:text-text hover:bg-navy-light"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ) : (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className="block w-full rounded px-3 py-2.5 text-left text-sm font-medium text-muted hover:text-text hover:bg-navy-light"
              >
                {label}
              </button>
            )
          )}
          {loggedIn ? (
            <>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-navy-dark">
                  {(username || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-accent">{username || 'User'}</p>
                  <p className="text-xs text-muted">
                    Balance:{' '}
                    <span className="font-semibold text-text">{balanceLabel || '—'}</span>
                  </p>
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
                className="mt-1 flex w-full items-center gap-2 rounded border border-red-500/30 px-3 py-2.5 text-left text-sm font-semibold text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-1 block w-full rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
