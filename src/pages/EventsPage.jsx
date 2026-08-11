import { useEffect } from 'react'
import SeoHead from '../components/SeoHead'
import LiveEvents from '../components/LiveEvents'

export default function EventsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <SeoHead
        title="Live Events — BpxPro"
        description="Browse live cricket, football, tennis and racing markets on BpxPro. Register via WhatsApp to start betting."
        keywords="live events, cricket betting, football odds, tennis markets, BpxPro"
        canonicalPath="/events"
        ogTitle="Live Events — BpxPro"
        ogDescription="Live cricket, football, tennis and racing markets updated in real time."
      />
      <LiveEvents />
    </>
  )
}
