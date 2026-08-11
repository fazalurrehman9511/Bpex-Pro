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
import { BRAND_NAME } from '../config/brand'
import BrandLogo from '../components/BrandLogo'
import { BPEXCH_LOGIN_EXTERNAL_URL, openBpexchLoginInNewTab } from '../utils/bpexchExternal'

export default function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
      aria-label={BRAND_NAME}
    >
      <BrandLogo size="header" />
    </Link>
  )
}

const baseNavLinks = [
  { label: 'Events', to: '/events' },
  { label: 'Deposit', to: '/payments' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
]

function openDashboardExternal(event) {
  if (openBpexchLoginInNewTab()) {
    event?.preventDefault?.()
  }
}

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
  const userText = String(username || '').trim() || '—'
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
    'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40'

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white pl-1 pr-2 text-left transition-colors sm:h-11 sm:gap-2.5 sm:pl-1.5 sm:pr-2.5 ${
          open
            ? 'border-emerald-300 ring-2 ring-emerald-600/20'
            : 'border-slate-200 hover:border-emerald-200'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
          {initial}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-[8.5rem] truncate text-xs font-semibold text-slate-900">
            {display}
          </span>
          <span className="block max-w-[8.5rem] truncate text-[11px] font-semibold text-emerald-700">
            {balText}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
        >
          <div className="border-b border-slate-100 px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{display}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Available{' '}
              <span className="font-semibold text-emerald-700">{balText}</span>
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Username</p>
                  <p className="truncate text-xs font-semibold text-slate-900">{userText}</p>
                </div>
                {username ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(username)
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded p-1 text-emerald-200 transition-colors hover:text-white"
                    aria-label="Copy username"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pt-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Password</p>
                  <p className="truncate text-xs font-semibold text-slate-900">{passText}</p>
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
                    className="mt-2 rounded p-1 text-muted transition-colors hover:text-accent"
                    aria-label="Copy password"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Lock className="mt-2.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <a
              href={BPEXCH_LOGIN_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={(e) => {
                setOpen(false)
                openDashboardExternal(e)
              }}
              className={itemClass}
            >
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              Dashboard
            </a>
            <Link to="/deposit" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Wallet className="h-4 w-4 text-slate-400" />
              Deposit
            </Link>
            <Link to="/withdraw" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <ArrowUpFromLine className="h-4 w-4 text-slate-400" />
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
            className="flex w-full cursor-pointer items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
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
  const navLinks = loggedIn
    ? baseNavLinks
    : baseNavLinks.filter((item) => item.to !== '/dashboard')

  return (
    <header className="brand-header sticky top-0 z-40">
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
                onClick={to === '/dashboard' ? openDashboardExternal : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive(to)
                    ? 'bg-white/20 text-white'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
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
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-white/10 hover:text-white lg:px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
                className={`hidden cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive('/deposit')
                    ? 'border-white/50 bg-white/20 text-white'
                    : 'border-white/25 text-white hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <Wallet className="h-3.5 w-3.5 text-[#25D366]" />
                <span className="hidden lg:inline">Deposit</span>
              </Link>
              <Link
                to="/withdraw"
                className={`hidden cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive('/withdraw')
                    ? 'border-white/50 bg-white/20 text-white'
                    : 'border-white/25 text-white hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-[#25D366]" />
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
                className={`hidden cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive('/login')
                    ? 'border-white/50 bg-white/20 text-white'
                    : 'border-white/25 text-white hover:border-white/40 hover:bg-white/10'
                }`}
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="btn-whatsapp hidden cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors sm:inline-flex sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <MessageCircle className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                Agent
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="hidden cursor-pointer items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:inline-flex sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#25D366]" />
                Myself
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="cursor-pointer rounded-lg p-1.5 text-emerald-100 hover:text-white md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/15 bg-emerald-900/40 px-4 py-3 backdrop-blur-sm md:hidden">
          {navLinks.map(({ label, id, to, icon: Icon }) =>
            to ? (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-50 hover:bg-white/10 hover:text-white"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-50 hover:bg-white/10 hover:text-white"
              >
                {label}
              </button>
            )
          )}
          {loggedIn ? (
            <>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-base font-bold text-white">
                  {(username || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{username || 'User'}</p>
                  <p className="text-xs font-semibold text-emerald-200">{balanceLabel || '—'}</p>
                  <p className="truncate text-[11px] text-emerald-100/80">Pass: {savedPassword || '—'}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (username) await navigator.clipboard.writeText(username)
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded p-1 text-emerald-200 transition-colors hover:text-white"
                    aria-label="Copy username"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (savedPassword) await navigator.clipboard.writeText(savedPassword)
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded p-1 text-emerald-200 transition-colors hover:text-white"
                    aria-label="Copy password"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Link
                to="/deposit"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-white"
              >
                <Wallet className="h-4 w-4 text-[#25D366]" />
                Deposit
              </Link>
              <Link
                to="/withdraw"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-white"
              >
                <ArrowUpFromLine className="h-4 w-4 text-[#25D366]" />
                Withdraw
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-red-400/40 px-3 py-2.5 text-left text-sm font-semibold text-red-200"
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
                className="mt-1 block w-full rounded-lg border border-white/20 px-3 py-2.5 text-left text-sm font-medium text-white"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openModal('register', { registerPath: 'whatsapp' })
                }}
                className="btn-whatsapp mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold"
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
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white"
              >
                <UserPlus className="h-4 w-4 text-[#25D366]" />
                Register Myself
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
