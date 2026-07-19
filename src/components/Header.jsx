import {
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  ArrowUpFromLine,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

function ProfileMenu({ username, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const display = username || 'User'
  const initial = display.charAt(0).toUpperCase()

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-navy-light py-0.5 pl-0.5 pr-2 text-text transition-colors hover:border-accent/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-navy-dark">
          {initial}
        </span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-muted transition-transform sm:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-navy-dark shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted">Signed in</p>
            <p className="truncate text-sm font-semibold text-accent">{display}</p>
          </div>
          <Link
            to="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text hover:bg-navy-light"
          >
            <LayoutDashboard className="h-4 w-4 text-accent" />
            Dashboard
          </Link>
          <Link
            to="/deposit"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text hover:bg-navy-light"
          >
            <Wallet className="h-4 w-4 text-accent" />
            Deposit
          </Link>
          <Link
            to="/withdraw"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text hover:bg-navy-light"
          >
            <ArrowUpFromLine className="h-4 w-4 text-accent" />
            Withdraw
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-semibold text-red-300 hover:bg-navy-light"
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
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])
  useEffect(() => subscribeBpexchUsername(setUsername), [])

  useEffect(() => {
    // Backfill username from JWT/cookie if dropdown still shows placeholder
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

  const handleNav = (id) => {
    navigateToSection(id, navigate, location.pathname)
    setMenuOpen(false)
  }

  const handleLogout = () => {
    clearBpexchSession()
    setLoggedIn(false)
    setUsername('')
    setMenuOpen(false)
    // Hit BPEXCH logout in background (best effort)
    try {
      fetch('/bpexch/Common/Logout', { credentials: 'include', redirect: 'manual' }).catch(() => {})
    } catch {
      /* ignore */
    }
    navigate('/login', { replace: true })
  }

  const isActive = (path) => location.pathname === path

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
                className={`hidden sm:inline-flex items-center gap-1.5 rounded border px-3.5 py-1.5 text-xs font-bold transition-colors sm:px-4 ${
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
                className={`hidden sm:inline-flex items-center gap-1.5 rounded border px-3.5 py-1.5 text-xs font-bold transition-colors sm:px-4 ${
                  isActive('/withdraw')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-navy-light text-text hover:border-accent/40'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-accent" />
                Withdraw
              </Link>
              <ProfileMenu username={username} onLogout={handleLogout} />
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
              <div className="mt-2 flex items-center gap-2 rounded border border-border px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-navy-dark">
                  {(username || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase text-muted">Signed in</p>
                  <p className="truncate text-sm font-semibold text-accent">{username || 'User'}</p>
                </div>
              </div>
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
