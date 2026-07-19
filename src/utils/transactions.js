const STORAGE_KEY = 'flowexch_transactions'
export const REQUEST_TTL_MS = 30 * 60 * 1000

export function parseBalanceAmount(value) {
  if (value == null || value === '') return null
  const match = String(value).match(/[\d,]+\.?\d*/)
  if (!match) return null
  return parseFloat(match[0].replace(/,/g, ''))
}

export function formatCurrency(amount, symbol = 'Rs.') {
  const sym = symbol.endsWith('.') ? symbol : `${symbol}.`
  return `${sym} ${Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
}

function nowIso() {
  return new Date().toISOString()
}

export function createTransactionId() {
  return `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? applyExpiry(list) : []
  } catch {
    return []
  }
}

export function saveTransactions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applyExpiry(list)))
}

export function applyExpiry(list) {
  const now = Date.now()
  return list.map((tx) => {
    if (tx.status !== 'pending') return tx
    if (new Date(tx.expiresAt).getTime() <= now) {
      return { ...tx, status: 'expired' }
    }
    return tx
  })
}

export function getRemainingMs(expiresAt) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now())
}

export function formatRemaining(ms) {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function createTransaction({
  type,
  amount,
  paymentMethodId,
  paymentMethodLabel,
  accountTitle,
  accountNumber,
  bankName,
  screenshot,
  payoutAccountTitle,
  payoutAccountNumber,
  name,
  phone,
  availableBalance,
}) {
  const createdAt = nowIso()
  const expiresAt = new Date(Date.now() + REQUEST_TTL_MS).toISOString()

  return {
    id: createTransactionId(),
    type,
    status: 'pending',
    amount: Number(amount),
    paymentMethodId,
    paymentMethodLabel,
    accountTitle: accountTitle || '',
    accountNumber: accountNumber || '',
    bankName: bankName || '',
    screenshot: screenshot || null,
    payoutAccountTitle: payoutAccountTitle || '',
    payoutAccountNumber: payoutAccountNumber || '',
    name: name.trim(),
    phone: phone.trim(),
    availableBalance: availableBalance ?? null,
    createdAt,
    expiresAt,
  }
}

export function addTransaction(list, tx) {
  const next = applyExpiry([tx, ...list])
  saveTransactions(next)
  return next
}

export function updateTransaction(list, id, patch) {
  const next = applyExpiry(
    list.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx))
  )
  saveTransactions(next)
  return next
}

export function updateTransactionStatus(list, id, status, notes = '') {
  return updateTransaction(list, id, {
    status,
    reviewedAt: nowIso(),
    adminNotes: notes || undefined,
  })
}

export async function readScreenshotFile(file, maxBytes = 800_000) {
  if (!file) return null
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image screenshot (JPG, PNG, etc.)')
  }
  if (file.size > maxBytes) {
    throw new Error('Screenshot must be under 800 KB')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read screenshot'))
    reader.readAsDataURL(file)
  })
}
