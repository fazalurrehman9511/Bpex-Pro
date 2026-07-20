import { Capacitor } from '@capacitor/core'

/** True when running as Capacitor APK or ?nativeApp=1 preview */
export function shouldUseNativeWalletApp() {
  if (typeof window === 'undefined') return false
  if (Capacitor.isNativePlatform()) return true
  const q = new URLSearchParams(window.location.search)
  return q.get('nativeApp') === '1'
}
