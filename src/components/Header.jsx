import { Menu, X, LayoutDashboard, Wallet, MessageCircle, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { navigateToSection } from '../utils/detectCountry'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
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

export function HeaderBar() {
  const { openModal } = useModal()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

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
            <Link
              to="/deposit"
              className={`inline-flex items-center gap-1.5 rounded border px-3.5 py-1.5 text-xs font-bold transition-colors sm:px-4 ${
                isActive('/deposit')
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-navy-light text-text hover:border-accent/40'
              }`}
            >
              <Wallet className="h-3.5 w-3.5 text-accent" />
              Add Balance
            </Link>
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
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="hidden sm:inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5 text-accent" />
                Self Register
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="inline-flex items-center gap-1 rounded bg-accent px-3.5 py-1.5 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors sm:px-4"
              >
                <MessageCircle className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Register via WhatsApp</span>
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
            <Link
              to="/deposit"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex w-full items-center gap-2 rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
            >
              <Wallet className="h-4 w-4 text-accent" />
              Add Balance
            </Link>
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
                  openModal('register', { registerPath: 'self' })
                }}
                className="mt-1 flex w-full items-center gap-2 rounded border border-border px-3 py-2.5 text-left text-sm font-medium text-text"
              >
                <UserPlus className="h-4 w-4 text-accent" />
                Self Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openModal('register', { registerPath: 'whatsapp' })
                }}
                className="mt-1 flex w-full items-center gap-2 rounded bg-accent px-3 py-2.5 text-left text-sm font-bold text-navy-dark"
              >
                <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                Register via WhatsApp
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
