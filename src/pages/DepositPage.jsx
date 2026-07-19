import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Home } from 'lucide-react'
import TransactionPanel from '../components/TransactionPanel'
import { getEmbedAvailableBalance } from '../utils/embedBalance'

export default function DepositPage() {
  const [params] = useSearchParams()
  const method = params.get('method') || 'jazzcash'
  const balance = getEmbedAvailableBalance()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="tx-page-bg flex-1 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[#73818f] hover:text-[#00b181] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <span className="text-[#c8ced3]">|</span>
          <Link to="/dashboard" className="text-[#73818f] hover:text-[#00b181] transition-colors">
            Dashboard
          </Link>
        </div>
        <TransactionPanel
          embedded
          type="deposit"
          availableBalance={balance}
          initialPaymentMethod={method}
        />
      </div>
    </div>
  )
}
