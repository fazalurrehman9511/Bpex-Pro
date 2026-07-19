import { X } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useState } from 'react'
import { BRAND_LOGO } from '../config/brand'

export default function InstallPrompt() {
  const { canPrompt, isIOS, isStandalone, install } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)

  if (isStandalone || dismissed) return null
  if (!canPrompt && !isIOS) return null

  const handleInstall = async () => {
    await install()
  }

  return (
    <div className="fixed bottom-[5.5rem] left-4 right-16 z-30 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-navy-light p-3.5 shadow-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <img src={BRAND_LOGO} alt="BPX" className="h-10 w-10 object-cover" decoding="async" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text">Install BpxPro App</p>
          <p className="mt-0.5 text-xs text-muted">
            {isIOS
              ? 'Tap Share → Add to Home Screen.'
              : 'Home screen pe app ki tarah install karo — APK ki zaroorat nahi.'}
          </p>
          {!isIOS && canPrompt && (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-2 rounded bg-accent px-3 py-1 text-xs font-bold text-navy-dark hover:bg-accent-hover"
            >
              Install Now
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-muted hover:text-text"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
