import { Home, LayoutDashboard, LogIn, UserPlus, Wallet, ArrowUpFromLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'

export default function BottomNav() {
  const { openModal } = useModal()
  const location = useLocation()
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

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

  const navItems = loggedIn
    ? [
        {
          icon: Home,
          label: 'Home',
          active: location.pathname === '/',
          action: () => navigate('/'),
        },
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          active: location.pathname === '/dashboard',
          action: () => navigate('/dashboard'),
        },
        {
          icon: Wallet,
          label: 'Deposit',
          active: location.pathname === '/deposit',
          action: () => navigate('/deposit'),
          accent: true,
        },
        {
          icon: ArrowUpFromLine,
          label: 'Withdraw',
          active: location.pathname === '/withdraw',
          action: () => navigate('/withdraw'),
        },
      ]
    : [
        {
          icon: Home,
          label: 'Home',
          active: location.pathname === '/',
          action: () => navigate('/'),
        },
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          active: location.pathname === '/dashboard',
          action: () => navigate('/dashboard'),
        },
        {
          icon: LogIn,
          label: 'Login',
          active: location.pathname === '/login',
          action: () => navigate('/login'),
        },
        {
          icon: UserPlus,
          label: 'Register',
          active: false,
          action: () => openModal('register'),
          accent: true,
        },
      ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-navy-dark/95 backdrop-blur-md sm:hidden">
      <div className="flex items-stretch">
        {navItems.map(({ icon: Icon, label, active, action, accent }) => (
          <button
            key={label}
            onClick={action}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
              accent
                ? 'text-accent'
                : active
                  ? 'text-accent'
                  : 'text-muted hover:text-text'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
