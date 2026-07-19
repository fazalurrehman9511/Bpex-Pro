import { fetchPaymentAccounts } from '../utils/api'

/** Fallback defaults — overridden by super-admin DB values via loadPaymentAccounts() */
export const paymentAccounts = {
  jazzcash: {
    id: 'jazzcash',
    label: 'JazzCash',
    accountTitle: import.meta.env.VITE_JAZZCASH_ACCOUNT_TITLE || 'BpxPro Agent',
    accountNumber: import.meta.env.VITE_JAZZCASH_ACCOUNT_NUMBER || '03001234567',
    bankName: 'JazzCash',
  },
  easypaisa: {
    id: 'easypaisa',
    label: 'EasyPaisa',
    accountTitle: import.meta.env.VITE_EASYPAISA_ACCOUNT_TITLE || 'BpxPro Agent',
    accountNumber: import.meta.env.VITE_EASYPAISA_ACCOUNT_NUMBER || '03451234567',
    bankName: 'EasyPaisa',
  },
  bank: {
    id: 'bank',
    label: 'Bank Transfer',
    accountTitle: import.meta.env.VITE_BANK_ACCOUNT_TITLE || 'BpxPro (Pvt) Ltd',
    accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || '12345678901234',
    bankName: import.meta.env.VITE_BANK_NAME || 'HBL — Main Branch',
  },
}

let cache = { ...paymentAccounts }

export function getPaymentAccount(id) {
  return cache[id] || Object.values(cache)[0] || paymentAccounts.jazzcash
}

export function getAllPaymentAccounts() {
  return { ...cache }
}

export function getPaymentMethodIds() {
  const ids = Object.keys(cache)
  return ids.length ? ids : ['jazzcash', 'easypaisa', 'bank']
}

/** Pull latest payment details from server (admin-editable). */
export async function loadPaymentAccounts() {
  try {
    const list = await fetchPaymentAccounts()
    if (Array.isArray(list) && list.length) {
      const next = {}
      for (const row of list) {
        if (!row?.id) continue
        next[row.id] = {
          id: row.id,
          label: row.label || row.id,
          accountTitle: row.accountTitle || '',
          accountNumber: row.accountNumber || '',
          bankName: row.bankName || '',
        }
      }
      cache = next
      for (const key of Object.keys(paymentAccounts)) {
        delete paymentAccounts[key]
      }
      Object.assign(paymentAccounts, next)
    }
  } catch (err) {
    console.warn('Payment accounts load failed, using defaults:', err.message)
  }
  return cache
}

/** @deprecated use getPaymentMethodIds() */
export const depositMethodIds = ['jazzcash', 'easypaisa', 'bank']
/** @deprecated use getPaymentMethodIds() */
export const withdrawMethodIds = ['jazzcash', 'easypaisa', 'bank']
