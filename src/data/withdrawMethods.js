import { fetchWithdrawMethods } from '../utils/api'

/** Fallback defaults — overridden by super-admin DB values via loadWithdrawMethods() */
export const withdrawMethods = {
  easypaisa: {
    id: 'easypaisa',
    label: 'EasyPaisa',
  },
  jazzcash: {
    id: 'jazzcash',
    label: 'JazzCash',
  },
  bank: {
    id: 'bank',
    label: 'Bank Transfer',
  },
}

let cache = { ...withdrawMethods }

export function getWithdrawMethod(id) {
  return cache[id] || Object.values(cache)[0] || withdrawMethods.easypaisa
}

export function getWithdrawMethodIds() {
  const ids = Object.keys(cache)
  return ids.length ? ids : ['easypaisa', 'jazzcash', 'bank']
}

export function getWithdrawMethodOptions() {
  return Object.values(cache)
}

export async function loadWithdrawMethods() {
  try {
    const list = await fetchWithdrawMethods()
    if (Array.isArray(list) && list.length) {
      const next = {}
      for (const row of list) {
        if (!row?.id) continue
        next[row.id] = {
          id: row.id,
          label: row.label || row.id,
        }
      }
      cache = next
      for (const key of Object.keys(withdrawMethods)) {
        delete withdrawMethods[key]
      }
      Object.assign(withdrawMethods, next)
    }
  } catch (err) {
    console.warn('Withdraw methods load failed, using defaults:', err.message)
  }
  return cache
}
