import { useEffect } from 'react'
import SeoHead from '../components/SeoHead'
import ContactUs from '../components/ContactUs'

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <SeoHead
        title="Contact Us — BpxPro"
        description="Contact BpxPro support for deposits, withdrawals, registration and account help. We reply within minutes."
        keywords="BpxPro contact, betting support, WhatsApp agent, deposit help"
        canonicalPath="/contact"
        ogTitle="Contact Us — BpxPro"
        ogDescription="Send a message or chat with support on WhatsApp."
      />
      <ContactUs />
    </>
  )
}
