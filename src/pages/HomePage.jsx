import { Suspense, lazy, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToSection } from '../utils/detectCountry'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import Categories from '../components/Categories'

const LiveEvents = lazy(() => import('../components/LiveEvents'))
const PaymentMethods = lazy(() => import('../components/PaymentMethods'))
const HowItWorks = lazy(() => import('../components/HowItWorks'))
const Features = lazy(() => import('../components/Features'))
const Testimonials = lazy(() => import('../components/Testimonials'))
const FAQ = lazy(() => import('../components/FAQ'))
const ContactUs = lazy(() => import('../components/ContactUs'))

function SectionFallback() {
  return <div className="min-h-[12rem] bg-navy" aria-hidden="true" />
}

function Deferred({ children }) {
  return <div className="[content-visibility:auto] [contain-intrinsic-size:auto_480px]">{children}</div>
}

export default function HomePage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      setTimeout(() => scrollToSection(id), 100)
    }
  }, [location.hash])

  return (
    <>
      <Hero />
      <StatsBar />
      <Categories />
      <Suspense fallback={<SectionFallback />}>
        <Deferred>
          <LiveEvents />
          <PaymentMethods />
          <HowItWorks />
          <Features />
          <Testimonials />
          <FAQ />
          <ContactUs />
        </Deferred>
      </Suspense>
    </>
  )
}
