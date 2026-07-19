import { useEffect } from 'react'
import EmbedFrame from '../components/EmbedFrame'

export default function PlatformEmbedPage({
  src,
  title,
  pageTitle,
  redirectOnLogin = false,
  listenForActions = false,
  syncPublicUrl = false,
}) {
  useEffect(() => {
    document.title = pageTitle
    return () => {
      document.title = 'BpxPro — Betting Exchange'
    }
  }, [pageTitle])

  return (
    <EmbedFrame
      src={src}
      title={title}
      redirectOnLogin={redirectOnLogin}
      listenForActions={listenForActions}
      syncPublicUrl={syncPublicUrl}
    />
  )
}
