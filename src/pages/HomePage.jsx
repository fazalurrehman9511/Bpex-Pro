import { Suspense, lazy, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scrollToSection } from '../utils/detectCountry'
import { useHomepageContent } from '../context/HomepageContentContext'
import SeoHead from '../components/SeoHead'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'

const LiveEvents = lazy(() => import('../components/LiveEvents'))
const PaymentMethods = lazy(() => import('../components/PaymentMethods'))
const HowItWorks = lazy(() => import('../components/HowItWorks'))
const Features = lazy(() => import('../components/Features'))
const Testimonials = lazy(() => import('../components/Testimonials'))
const FAQ = lazy(() => import('../components/FAQ'))
const ContactUs = lazy(() => import('../components/ContactUs'))
const FLASH_MESSAGE_KEY = 'flowexch_flash_message'

function SectionFallback() {
  return <div className="min-h-[12rem] bg-slate-50" aria-hidden="true" />
}

function Deferred({ children }) {
  return <div className="[content-visibility:auto] [contain-intrinsic-size:auto_480px]">{children}</div>
}

function HomePageSeo() {
  const { seo } = useHomepageContent()

  return (
    <SeoHead
      title={seo.metaTitle}
      description={seo.metaDescription}
      keywords={seo.metaKeywords}
      ogTitle={seo.metaTitle}
      ogDescription={seo.metaDescription}
      twitterTitle={seo.metaTitle}
      twitterDescription={seo.metaDescription}
      canonicalPath="/"
    />
  )
}

export default function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [flashMessage, setFlashMessage] = useState('')

  useEffect(() => {
    const fromState = location.state?.scrollTo
    const fromHash = location.hash ? location.hash.replace(/^#+/, '').trim() : ''
    const scrollTarget = fromState || fromHash
    if (!scrollTarget) return undefined

    const timer = window.setTimeout(() => {
      scrollToSection(scrollTarget)
      if (fromState || fromHash) {
        navigate('/', { replace: true, state: null })
      }
    }, 100)

    return () => window.clearTimeout(timer)
  }, [location.state, location.hash, navigate])

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem(FLASH_MESSAGE_KEY) || ''
      if (!msg) return undefined
      setFlashMessage(msg)
      sessionStorage.removeItem(FLASH_MESSAGE_KEY)
      const timer = window.setTimeout(() => setFlashMessage(''), 3500)
      return () => window.clearTimeout(timer)
    } catch {
      return undefined
    }
  }, [])

  return (
    <>
      <HomePageSeo />
      {flashMessage ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[55] flex justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20">
            {flashMessage}
          </div>
        </div>
      ) : null}
      <Hero />
      <StatsBar />
      <Suspense fallback={<SectionFallback />}>
        <Deferred>
          <HowItWorks />
          <LiveEvents />
          <PaymentMethods />
          <Features />
          <Testimonials />
          <FAQ />
          <ContactUs />
        </Deferred>
      </Suspense>
    </>
  )
}
