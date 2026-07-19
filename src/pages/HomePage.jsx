import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToSection } from '../utils/detectCountry'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import Categories from '../components/Categories'
import LiveEvents from '../components/LiveEvents'
import PaymentMethods from '../components/PaymentMethods'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'
import ContactUs from '../components/ContactUs'

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
      <LiveEvents />
      <PaymentMethods />
      <HowItWorks />
      <Features />
      <Testimonials />
      <FAQ />
      <ContactUs />
    </>
  )
}
