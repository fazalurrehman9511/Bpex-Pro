/** Balance passed from dashboard iframe when navigating to deposit/withdraw pages */
const BALANCE_KEY = 'flowexch_available_balance'

export function setEmbedAvailableBalance(value) {
  if (value) sessionStorage.setItem(BALANCE_KEY, value)
  else sessionStorage.removeItem(BALANCE_KEY)
}

export function getEmbedAvailableBalance() {
  return sessionStorage.getItem(BALANCE_KEY)
}

export const COMPACT_BREAKPOINT = 992
export const NARROW_BREAKPOINT = 659
