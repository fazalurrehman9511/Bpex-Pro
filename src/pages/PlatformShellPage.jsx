import PlatformEmbedPage from './PlatformEmbedPage'

/** BPEXCH platform — browser URL stays /dashboard only */
export default function PlatformShellPage() {
  return (
    <PlatformEmbedPage
      src="/bpexch/Common/Dashboard"
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
    />
  )
}
