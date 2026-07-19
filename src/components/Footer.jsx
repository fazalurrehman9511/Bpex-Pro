import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCountries, loadWhatsappAgents } from '../data/countries'
import { navigateToSection } from '../utils/detectCountry'
import { useModal } from '../context/ModalContext'
import { BRAND_LOGO, BRAND_NAME, SITE_DOMAIN } from '../config/brand'

const links = [
  { label: 'Live Events', id: 'events' },
  { label: 'Add Balance', id: 'payments' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact Us', id: 'contact' },
]

export default function Footer() {
  const { openModal } = useModal()
  const location = useLocation()
  const navigate = useNavigate()
  const [countryList, setCountryList] = useState(() => getCountries())

  useEffect(() => {
    loadWhatsappAgents().then(setCountryList)
  }, [])

  const handleLink = (id) => {
    navigateToSection(id, navigate, location.pathname)
  }

  return (
    <footer className="border-t border-border bg-navy-dark px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <Link to="/" className="inline-flex items-center hover:opacity-90">
              <img
                src={BRAND_LOGO}
                alt="BPX"
                width={72}
                height={72}
                className="h-9 w-9 object-contain"
                decoding="async"
              />
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Pakistan&apos;s trusted betting exchange agent. Cricket, Casino, Sports — with 24/7 WhatsApp support.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Quick Links</p>
            <div className="flex flex-col gap-2">
              {links.map(({ label, id, to }) =>
                to ? (
                  <Link
                    key={to}
                    to={to}
                    className="text-left text-xs text-muted hover:text-accent transition-colors"
                  >
                    {label}
                  </Link>
                ) : (
                  <button
                    key={id}
                    onClick={() => handleLink(id)}
                    className="text-left text-xs text-muted hover:text-accent transition-colors"
                  >
                    {label}
                  </button>
                )
              )}
              <button
                onClick={() => openModal('register')}
                className="text-left text-xs text-accent font-semibold hover:underline"
              >
                WhatsApp Register
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Countries Served</p>
            <div className="flex flex-wrap gap-1.5">
              {countryList.map((c) => (
                <span
                  key={c.code}
                  className="rounded bg-navy-light border border-border px-2 py-1 text-[10px] text-muted"
                >
                  {c.flag} {c.code}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted">
              JazzCash · EasyPaisa · Bank · Crypto
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center">
          <p className="text-[10px] text-muted/60">
            18+ only. Bet responsibly. {BRAND_NAME} is an agent platform — register via WhatsApp to get started.
          </p>
          <p className="mt-1 text-[10px] text-muted/40">
            &copy; {new Date().getFullYear()} {BRAND_NAME} · {SITE_DOMAIN}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
