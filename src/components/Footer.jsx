import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCountries, loadWhatsappAgents } from '../data/countries'
import { useHomepageContent } from '../context/HomepageContentContext'
import { navigateToSection } from '../utils/detectCountry'
import { useModal } from '../context/ModalContext'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import { BRAND_LOGO, BRAND_NAME, SITE_DOMAIN } from '../config/brand'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'
import { useBrandGuideContent } from '../context/BrandGuideContentContext'
import { getBrandGuidePath } from '../data/brandGuideContent'
import SocialLinks from './SocialLinks'

const baseLinks = [
  { label: 'Live Events', to: '/events' },
  { label: 'Add Balance', to: '/payments' },
  { label: 'Brand Guide', brandGuide: true },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Responsible Gaming', to: '/responsible-gaming' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact Us', to: '/contact' },
]

export default function Footer() {
  const { openModal } = useModal()
  const location = useLocation()
  const navigate = useNavigate()
  const { footer } = useHomepageContent()
  const brandGuideContent = useBrandGuideContent()
  const brandGuidePath = getBrandGuidePath(brandGuideContent)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())
  const [countryList, setCountryList] = useState(() => getCountries())

  useEffect(() => {
    loadWhatsappAgents().then(setCountryList)
  }, [])

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  const links = loggedIn
    ? baseLinks
    : baseLinks.filter((item) => item.to !== '/dashboard')

  const handleSectionLink = (e, id) => {
    e.preventDefault()
    navigateToSection(id, navigate, location.pathname)
  }

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

  return (
    <footer className="brand-footer px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Link to="/" className="inline-flex items-center hover:opacity-90">
              <img
                src={BRAND_LOGO}
                alt={`${BRAND_NAME} logo`}
                width={72}
                height={72}
                className="h-11 w-11 object-contain"
                decoding="async"
                loading="lazy"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">
              {footer.tagline}
            </p>
            <SocialLinks
              social={footer.social}
              variant="footer"
              className="mt-5"
              title="Follow Us"
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-300/80">Quick Links</p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer">
              {links.map(({ label, id, to, brandGuide }) => {
                const href = brandGuide ? brandGuidePath : to
                return href ? (
                  <Link
                    key={href}
                    to={href}
                    onClick={href === '/dashboard' ? openDashboard : undefined}
                    className="text-left text-sm text-emerald-50/90 transition-colors hover:text-[#25D366]"
                  >
                    {label}
                  </Link>
                ) : (
                  <button
                    key={id}
                    type="button"
                    onClick={(e) => handleSectionLink(e, id)}
                    className="cursor-pointer text-left text-sm text-emerald-50/90 transition-colors hover:text-[#25D366]"
                  >
                    {label}
                  </button>
                )
              })}
              {!loggedIn && (
                <>
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                    className="cursor-pointer text-left text-sm font-semibold text-[#25D366] hover:underline"
                  >
                    Register with Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'self' })}
                    className="cursor-pointer text-left text-sm text-emerald-50/90 transition-colors hover:text-[#25D366]"
                  >
                    Register Myself
                  </button>
                </>
              )}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-300/80">Countries Served</p>
            <div className="flex flex-wrap gap-1.5">
              {countryList.map((c) => (
                <span
                  key={c.code}
                  className="rounded-md border border-emerald-400/25 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-50"
                >
                  {c.flag} {c.code}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-emerald-200/70">JazzCash · EasyPaisa · Bank · Crypto</p>
          </div>
        </div>

        <div className="mt-10 border-t border-emerald-500/20 pt-6 text-center">
          <p className="text-xs text-emerald-100/80">
            18+ only. Bet responsibly. {BRAND_NAME} is an agent platform — register via WhatsApp to get started.
          </p>
          <p className="mt-1.5 text-xs text-emerald-200/50">
            &copy; {new Date().getFullYear()} {BRAND_NAME} · {SITE_DOMAIN}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
