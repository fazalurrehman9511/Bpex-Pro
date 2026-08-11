import { useEffect } from 'react'
import SeoHead from '../components/SeoHead'
import PaymentMethods from '../components/PaymentMethods'

export default function PaymentsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <SeoHead
        title="Deposit Methods — BpxPro"
        description="Add balance with JazzCash, EasyPaisa, bank transfer or crypto. Fast local deposits for Pakistan and international players."
        keywords="JazzCash deposit, EasyPaisa deposit, BpxPro deposit, crypto deposit"
        canonicalPath="/payments"
        ogTitle="Deposit Methods — BpxPro"
        ogDescription="JazzCash, EasyPaisa, bank transfer and crypto deposit options."
      />
      <PaymentMethods />
    </>
  )
}
