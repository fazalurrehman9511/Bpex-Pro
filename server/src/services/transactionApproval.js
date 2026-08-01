import { db, updateBpexchUserBalance } from '../db.js'
import {
  isBpexchCashConfigured,
  depositCashToBpexchUser,
  withdrawCashFromBpexchUser,
} from './bpexchCash.js'

export class TransactionApprovalError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

export function finalizeTransactionStatus(existing, status, adminNotes) {
  const reviewedAt = new Date().toISOString()
  const result = db
    .prepare(
      `
    UPDATE transactions
    SET status = ?, admin_notes = ?, reviewed_at = ?
    WHERE id = ? AND status = 'pending'
  `,
    )
    .run(status, adminNotes || null, reviewedAt, existing.id)
  return result.changes > 0
}

/**
 * Approve a pending deposit or withdraw and sync BPEXCH cash.
 * @param {object} existing - transactions table row
 */
export async function approveTransaction(existing, { adminNotes = '' } = {}) {
  if (!existing || existing.status !== 'pending') {
    throw new TransactionApprovalError('Only pending transactions can be approved')
  }

  if (!isBpexchCashConfigured()) {
    throw new TransactionApprovalError(
      'BPEXCH agent not configured. Set BPEXCH_AGENT_USERNAME / BPEXCH_AGENT_PASSWORD to auto-credit.',
      503,
    )
  }

  const bpexchUsername = String(existing.name || '').trim()
  if (!bpexchUsername) {
    throw new TransactionApprovalError(
      'Transaction has no BPEXCH username (name). Cannot credit on BPEXCH.',
    )
  }

  let notes = adminNotes?.trim() || ''
  let bpexchMeta = null

  try {
    if (existing.type === 'deposit') {
      bpexchMeta = await depositCashToBpexchUser({
        username: bpexchUsername,
        amount: existing.amount,
        description: `Cash deposit in ${bpexchUsername} (FlowExch ${existing.id})`,
      })
      notes = [
        notes,
        `BPEXCH cash +${existing.amount} → ${bpexchUsername} (id ${bpexchMeta.userId})`,
      ]
        .filter(Boolean)
        .join(' | ')
    } else if (existing.type === 'withdraw') {
      bpexchMeta = await withdrawCashFromBpexchUser({
        username: bpexchUsername,
        amount: existing.amount,
        description: `Cash withdrawn from ${bpexchUsername} (FlowExch ${existing.id})`,
      })
      notes = [
        notes,
        `BPEXCH cash -${existing.amount} ← ${bpexchUsername} (id ${bpexchMeta.userId})`,
      ]
        .filter(Boolean)
        .join(' | ')
    } else {
      throw new TransactionApprovalError('Unknown transaction type')
    }
  } catch (err) {
    if (err instanceof TransactionApprovalError) throw err
    throw new TransactionApprovalError(`BPEXCH amount update failed: ${err.message}`, 502)
  }

  if (bpexchMeta && bpexchUsername) {
    updateBpexchUserBalance(bpexchUsername, {
      userId: bpexchMeta.userId,
      credit: bpexchMeta.credit,
      balance: bpexchMeta.balance,
      maxWithdraw: bpexchMeta.maxWithdraw,
    })
  }

  const ok = finalizeTransactionStatus(existing, 'approved', notes)
  if (!ok) {
    throw new TransactionApprovalError('Transaction was already processed')
  }

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(existing.id)
  return { row, bpexchMeta, notes }
}
