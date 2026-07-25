import { Router } from 'express'
import { db, updateBpexchUserBalance } from '../db.js'
import {
  getBpexchUserBalance,
  isBpexchCashConfigured,
  MIN_BALANCE_FOR_WITHDRAW,
} from '../services/bpexchCash.js'

const router = Router()

/** Public: live BPEXCH balance for wallet app (by username). */
router.get('/', async (req, res) => {
  const username = String(req.query.username || '').trim()
  try {
    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }
    if (!isBpexchCashConfigured()) {
      return res.status(503).json({ error: 'BPEXCH agent is not configured' })
    }

    const info = await getBpexchUserBalance(username)
    updateBpexchUserBalance(username, {
      userId: info.userId,
      credit: info.credit,
      balance: info.balance,
      maxWithdraw: info.maxWithdraw,
    })

    const canWithdraw = Number(info.balance) >= MIN_BALANCE_FOR_WITHDRAW
    res.json({
      username: info.username,
      userId: info.userId,
      balance: info.balance,
      credit: info.credit,
      maxWithdraw: info.maxWithdraw,
      canWithdraw,
      minBalanceForWithdraw: MIN_BALANCE_FOR_WITHDRAW,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Balance fetch error:', err)
    const cached = db
      .prepare('SELECT * FROM bpexch_users WHERE lower(username) = lower(?)')
      .get(username)
    if (cached && cached.balance != null) {
      const balance = Number(cached.balance)
      return res.json({
        username: cached.username,
        userId: cached.bpexch_id || null,
        balance,
        credit: cached.credit == null ? null : Number(cached.credit),
        maxWithdraw: cached.max_withdraw == null ? null : Number(cached.max_withdraw),
        canWithdraw: balance >= MIN_BALANCE_FOR_WITHDRAW,
        minBalanceForWithdraw: MIN_BALANCE_FOR_WITHDRAW,
        updatedAt: cached.balance_updated_at,
        cached: true,
        warning: err.message,
      })
    }
    const fallback = db
      .prepare('SELECT * FROM bpexch_users WHERE lower(username) = lower(?)')
      .get(username)
    if (fallback) {
      return res.json({
        username: fallback.username,
        userId: fallback.bpexch_id || null,
        balance: null,
        credit: fallback.credit == null ? null : Number(fallback.credit),
        maxWithdraw: fallback.max_withdraw == null ? null : Number(fallback.max_withdraw),
        canWithdraw: false,
        minBalanceForWithdraw: MIN_BALANCE_FOR_WITHDRAW,
        updatedAt: fallback.balance_updated_at || null,
        cached: true,
        warning: err.message || 'Failed to fetch BPEXCH balance',
      })
    }
    res.status(502).json({ error: err.message || 'Failed to fetch BPEXCH balance' })
  }
})

export default router
