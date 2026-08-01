import { db } from '../db.js'
import { config } from '../config.js'
import {
  isBpexchCashConfigured,
  getBpexchUserBalance,
  MIN_BALANCE_FOR_WITHDRAW,
} from './bpexchCash.js'
import { approveTransaction, finalizeTransactionStatus } from './transactionApproval.js'

let running = false

async function processOneWithdraw(row) {
  const fresh = db.prepare('SELECT * FROM transactions WHERE id = ?').get(row.id)
  if (!fresh || fresh.status !== 'pending' || fresh.type !== 'withdraw') return
  if (fresh.expires_at > new Date().toISOString()) return

  const waitMinutes = Math.round(config.withdrawAutoApproveMs / 60_000)

  if (!isBpexchCashConfigured()) {
    console.warn(`[withdraw-auto] Skip ${fresh.id}: BPEXCH agent not configured`)
    return
  }

  const username = String(fresh.name || '').trim()
  if (!username) {
    finalizeTransactionStatus(
      fresh,
      'rejected',
      `Auto-rejected after ${waitMinutes} min: missing username`,
    )
    return
  }

  const amt = Number(fresh.amount)
  try {
    const info = await getBpexchUserBalance(username)
    const bal = Number(info.balance)

    if (!Number.isFinite(bal) || bal < MIN_BALANCE_FOR_WITHDRAW || amt > bal) {
      finalizeTransactionStatus(
        fresh,
        'rejected',
        `Auto-rejected after ${waitMinutes} min: insufficient balance (PKR ${Number.isFinite(bal) ? bal : '?'})`,
      )
      return
    }

    await approveTransaction(fresh, {
      adminNotes: `Auto-approved after ${waitMinutes} minutes (sufficient balance)`,
    })
    console.log(`[withdraw-auto] Approved ${fresh.id} for ${username} PKR ${amt}`)
  } catch (err) {
    console.error(`[withdraw-auto] Failed ${fresh.id}:`, err.message)
  }
}

/** Auto-approve pending withdraws past their expiry when user still has enough balance. */
export async function processWithdrawAutoApprovals() {
  if (running) return
  running = true
  try {
    const now = new Date().toISOString()
    const rows = db
      .prepare(
        `
      SELECT * FROM transactions
      WHERE type = 'withdraw' AND status = 'pending' AND expires_at <= ?
      ORDER BY expires_at ASC
      LIMIT 25
    `,
      )
      .all(now)

    for (const row of rows) {
      await processOneWithdraw(row)
    }
  } finally {
    running = false
  }
}
