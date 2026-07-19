import { useEffect, useState, useCallback } from 'react'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    setIsIOS(/iPad|iPhone|iPod/.test(ua))
    setIsAndroid(/Android/i.test(ua))
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    )

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return { ok: false, reason: 'unavailable' }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (choice.outcome === 'accepted') {
      setInstalled(true)
      return { ok: true }
    }
    return { ok: false, reason: 'dismissed' }
  }, [deferredPrompt])

  return {
    canPrompt: Boolean(deferredPrompt),
    isIOS,
    isAndroid,
    isStandalone,
    installed,
    install,
  }
}
