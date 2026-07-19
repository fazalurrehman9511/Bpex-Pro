/** Balance passed from dashboard iframe when navigating to deposit/withdraw pages */
const BALANCE_KEY = 'flowexch_available_balance'
const EVENT = 'flowexch-balance-change'

export function setEmbedAvailableBalance(value) {
  const next = value ? String(value) : ''
  try {
    if (next) sessionStorage.setItem(BALANCE_KEY, next)
    else sessionStorage.removeItem(BALANCE_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { balance: next } }))
  }
}

export function getEmbedAvailableBalance() {
  try {
    return sessionStorage.getItem(BALANCE_KEY) || ''
  } catch {
    return ''
  }
}

export function subscribeEmbedBalance(listener) {
  const onChange = () => listener(getEmbedAvailableBalance())
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
    window.removeEventListener('focus', onChange)
  }
}

export const COMPACT_BREAKPOINT = 992
export const NARROW_BREAKPOINT = 659
