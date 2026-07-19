import { useState } from 'react'
import {
  Download,
  Smartphone,
  Shield,
  MessageCircle,
  UserPlus,
} from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { ANDROID_APK_URL, ANDROID_APK_AVAILABLE, ANDROID_APP } from '../config/androidApp'
import { usePwaInstall } from '../hooks/usePwaInstall'
import {
  PREVIEW_SCREENS,
  ScreenLogin,
  ScreenWallet,
  ScreenDeposit,
  ScreenMethod,
  ScreenProof,
  ScreenWithdraw,
} from '../mobile/walletScreens'

function PhoneChrome({ children }) {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.1rem] border-[5px] border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-black/50">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-white">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-slate-900" />
          <div className="min-h-[520px]">{children}</div>
        </div>
      </div>
    </div>
  )
}

function PreviewScreen({ id }) {
  if (id === 'login') return <ScreenLogin username="" password="" preview />
  if (id === 'wallet') {
    return <ScreenWallet preview notifications={[]} transactions={[]} />
  }
  if (id === 'deposit') return <ScreenDeposit amount="" preview />
  if (id === 'method') {
    return (
      <ScreenMethod
        amount="50000"
        method="easypaisa"
        methodOpen={false}
        accountTitle="BpxPro Agent"
        accountNumber="0345 1234567"
        preview
      />
    )
  }
  if (id === 'proof') return <ScreenProof amount="50000" preview />
  if (id === 'withdraw') return <ScreenWithdraw method="easypaisa" preview />
  return <ScreenWallet preview notifications={[]} transactions={[]} />
}

export default function AndroidApp() {
  const { openModal } = useModal()
  const [screen, setScreen] = useState('wallet')
  const [showHow, setShowHow] = useState(false)
  const { canPrompt, isIOS, isStandalone, installed, install } = usePwaInstall()

  return (
    <section id="app" className="relative overflow-hidden bg-navy-dark px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(37,211,102,0.14)_0%,_transparent_50%)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-6 text-center sm:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
            <Smartphone className="h-3.5 w-3.5" />
            Android App
          </div>
          <h2 className="text-xl font-extrabold text-text sm:text-2xl">
            App screens — website alag, APK alag
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Neeche jo screens dikh rahi hain — Login, Wallet, Deposit, Method, Proof, Withdraw —
            wahi APK mein khulti hain. Poori website app nahi banti.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {PREVIEW_SCREENS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScreen(s.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
                    screen === s.id
                      ? 'bg-accent text-navy-dark'
                      : 'border border-border bg-navy-light text-muted hover:text-text'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <PhoneChrome>
              <PreviewScreen id={screen} />
            </PhoneChrome>

            <p className="mt-3 text-center text-[10px] text-muted lg:hidden">
              Tabs pe tap karke har screen dekho
            </p>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-navy-light p-5">
              <p className="text-sm font-bold text-text">Download {ANDROID_APP.name} APK</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Sirf wallet app screens — Play Protect pe <strong className="text-text">Install anyway</strong>{' '}
                dabao.
              </p>

              {ANDROID_APK_AVAILABLE ? (
                <a
                  href={ANDROID_APK_URL}
                  download="flowexch.apk"
                  type="application/vnd.android.package-archive"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Download APK ({ANDROID_APP.versionLabel})
                </a>
              ) : (
                <p className="mt-4 rounded-xl border border-border px-3 py-3 text-center text-xs text-muted">
                  APK abhi ready nahi — thodi der baad try karo.
                </p>
              )}

              {ANDROID_APK_AVAILABLE && (
                <ol className="mt-3 list-decimal space-y-1 rounded-xl border border-accent/30 bg-navy-dark px-3 py-3 pl-7 text-[11px] leading-relaxed text-muted">
                  <li>APK download (~4 MB)</li>
                  <li>Open → agar block ho to Allow unknown apps</li>
                  <li>
                    Play Protect → <strong className="text-accent">Install anyway</strong>
                  </li>
                </ol>
              )}

              {isStandalone || installed ? (
                <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-center">
                  <p className="text-xs font-bold text-accent">Home-screen app already installed ✓</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const result = await install()
                    if (!result.ok) setShowHow(true)
                  }}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
                >
                  <Smartphone className="h-3.5 w-3.5 text-accent" />
                  {canPrompt ? 'Or install from Chrome (PWA)' : 'Chrome install — How?'}
                </button>
              )}

              {showHow && (
                <div className="mt-3 rounded-xl border border-accent/30 bg-navy-dark px-3 py-3 text-[11px] leading-relaxed text-muted">
                  <p className="font-bold text-text">Phone pe Chrome install:</p>
                  {isIOS ? (
                    <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                      <li>Safari → Share → Add to Home Screen</li>
                    </ol>
                  ) : (
                    <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                      <li>Chrome → Menu → Install app</li>
                    </ol>
                  )}
                </div>
              )}

              <div className="mt-2.5 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  Register via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => openModal('register', { registerPath: 'self' })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-accent" />
                  Self Register
                </button>
              </div>

              <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-accent" />
                  Wallet app only (not full website)
                </span>
                <span>{ANDROID_APP.minAndroid}</span>
                <span>v{ANDROID_APP.versionLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
