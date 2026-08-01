import { Wallet, Smartphone, Landmark, Bitcoin, Clock } from 'lucide-react'
import { paymentMethods } from '../data/paymentMethods'

const icons = {
  jazzcash: Smartphone,
  easypaisa: Smartphone,
  bank: Landmark,
  crypto: Bitcoin,
}

export default function PaymentMethods() {
  return (
    <section id="payments" className="section-tint-amber px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="editorial-section-label">Deposits</p>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Add Balance</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">JazzCash · EasyPaisa · Bank · Crypto</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const Icon = icons[method.id] || Wallet
            return (
              <div
                key={method.id}
                className="editorial-card flex items-start gap-4 p-5"
                style={{ borderLeftColor: method.accent, borderLeftWidth: 3 }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${method.accent}18` }}
                >
                  <Icon className="h-5 w-5" style={{ color: method.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{method.name}</h3>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: method.accent }}
                    >
                      {method.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{method.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Min: <strong className="text-slate-800">{method.minDeposit}</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {method.processing}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Transfer → upload screenshot → track status (30 min)
        </p>
      </div>
    </section>
  )
}
