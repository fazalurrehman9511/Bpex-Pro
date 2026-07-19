/** Official JazzCash / EasyPaisa logos from /public/payment-logos. */

const JAZZCASH_SRC = '/payment-logos/jazzcash.png'
const EASYPAISA_SRC = '/payment-logos/easypaisa.png'

export function JazzCashLogo({ className = 'h-10 w-10' }) {
  return (
    <img
      src={JAZZCASH_SRC}
      alt="JazzCash"
      className={`${className} rounded-lg object-contain bg-white`}
      draggable={false}
    />
  )
}

export function EasyPaisaLogo({ className = 'h-10 w-10' }) {
  return (
    <img
      src={EASYPAISA_SRC}
      alt="EasyPaisa"
      className={`${className} rounded-lg object-contain bg-white`}
      draggable={false}
    />
  )
}

export function BankLogo({ className = 'h-10 w-10' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#1D4ED8" />
      <path
        d="M24 12l14 7.5v2.5H10v-2.5L24 12zm-9 12h4v8h-4v-8zm9 0h4v8h-4v-8zm9 0h4v8h-4v-8zM10 34h28v3H10v-3z"
        fill="#fff"
      />
    </svg>
  )
}

export function PaymentMethodLogo({ id, className = 'h-10 w-10' }) {
  if (id === 'jazzcash') return <JazzCashLogo className={className} />
  if (id === 'easypaisa') return <EasyPaisaLogo className={className} />
  return <BankLogo className={className} />
}
