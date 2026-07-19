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
    <section id="payments" className="bg-navy-dark px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-accent" />
          <div>
            <h2 className="text-base font-bold text-text sm:text-lg">Add Balance</h2>
            <p className="text-xs text-muted">JazzCash · EasyPaisa · Bank · Crypto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const Icon = icons[method.id] || Wallet
            return (
              <div
                key={method.id}
                className="flex items-start gap-3 rounded border border-border bg-navy-light p-4"
                style={{ borderLeftColor: method.accent, borderLeftWidth: 3 }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: `${method.accent}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: method.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text">{method.name}</h3>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-navy-dark"
                      style={{ backgroundColor: method.accent }}
                    >
                      {method.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{method.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                    <span>Min: <strong className="text-text">{method.minDeposit}</strong></span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {method.processing}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted">
          Transfer → upload screenshot → track status (30 min)
        </p>
      </div>
    </section>
  )
}
