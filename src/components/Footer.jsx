import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCountries, loadWhatsappAgents } from '../data/countries'
import { navigateToSection } from '../utils/detectCountry'
import { useModal } from '../context/ModalContext'
import { BRAND_LOGO, BRAND_NAME, SITE_DOMAIN } from '../config/brand'

const links = [
  { label: 'Live Events', href: '/#events' },
  { label: 'Add Balance', href: '/#payments' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact Us', href: '/#contact' },
]

export default function Footer() {
  const { openModal } = useModal()
  const location = useLocation()
  const navigate = useNavigate()
  const [countryList, setCountryList] = useState(() => getCountries())

  useEffect(() => {
    loadWhatsappAgents().then(setCountryList)
  }, [])

  const handleHashLink = (e, href) => {
    const id = href.replace('/#', '')
    if (location.pathname === '/') {
      e.preventDefault()
      navigateToSection(id, navigate, location.pathname)
    }
  }

  return (
    <footer className="border-t border-border bg-navy-dark px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <Link to="/" className="inline-flex items-center hover:opacity-90">
              <img
                src={BRAND_LOGO}
                alt={`${BRAND_NAME} logo`}
                width={72}
                height={72}
                className="h-9 w-9 object-contain"
                decoding="async"
                loading="lazy"
              />
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Pakistan&apos;s trusted betting exchange agent. Cricket, Casino, Sports — with 24/7 WhatsApp support.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Quick Links</p>
            <nav className="flex flex-col gap-2" aria-label="Footer">
              {links.map(({ label, href, to }) =>
                to ? (
                  <Link
                    key={to}
                    to={to}
                    className="text-left text-xs text-muted transition-colors hover:text-accent"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => handleHashLink(e, href)}
                    className="text-left text-xs text-muted transition-colors hover:text-accent"
                  >
                    {label}
                  </a>
                ),
              )}
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="cursor-pointer text-left text-xs font-semibold text-accent hover:underline"
              >
                Register with Agent
              </button>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'self' })}
                className="cursor-pointer text-left text-xs text-muted transition-colors hover:text-accent"
              >
                Register Myself
              </button>
            </nav>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Countries Served</p>
            <div className="flex flex-wrap gap-1.5">
              {countryList.map((c) => (
                <span
                  key={c.code}
                  className="rounded border border-border bg-navy-light px-2 py-1 text-xs text-muted"
                >
                  {c.flag} {c.code}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">JazzCash · EasyPaisa · Bank · Crypto</p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted/70">
            18+ only. Bet responsibly. {BRAND_NAME} is an agent platform — register via WhatsApp to get started.
          </p>
          <p className="mt-1 text-xs text-muted/50">
            &copy; {new Date().getFullYear()} {BRAND_NAME} · {SITE_DOMAIN}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
