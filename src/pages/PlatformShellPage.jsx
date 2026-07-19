import PlatformEmbedPage from './PlatformEmbedPage'
import { useEffect } from 'react'
import { setBpexchLoggedIn } from '../utils/bpexchAuth'

/** BPEXCH platform — browser URL stays /dashboard only */
export default function PlatformShellPage() {
  useEffect(() => {
    setBpexchLoggedIn(true)
  }, [])

  return (
    <PlatformEmbedPage
      src="/bpexch/Common/Dashboard"
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
    />
  )
}
