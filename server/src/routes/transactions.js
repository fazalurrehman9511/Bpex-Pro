import { Router } from 'express'
import { db, expirePendingTransactions, rowToTransaction } from '../db.js'
import { config } from '../config.js'
import { createTransactionId } from '../utils/id.js'
import { saveScreenshot } from '../utils/screenshot.js'
import {
  getBpexchUserBalance,
  isBpexchCashConfigured,
  MIN_BALANCE_FOR_WITHDRAW,
} from '../services/bpexchCash.js'

const router = Router()
const MIN_WITHDRAW_AMOUNT = 500

router.post('/', async (req, res) => {
  try {
    const {
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
    } = req.body

    if (!type || !['deposit', 'withdraw'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' })
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }
    if (!paymentMethodId || !paymentMethodLabel) {
      return res.status(400).json({ error: 'Payment method is required' })
    }
    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'Name and phone are required' })
    }
    if (type === 'deposit' && !screenshot) {
      return res.status(400).json({ error: 'Payment screenshot is required for deposits' })
    }
    if (type === 'withdraw' && (!payoutAccountTitle?.trim() || !payoutAccountNumber?.trim())) {
      return res.status(400).json({ error: 'Payout account details are required for withdrawals' })
    }

    let resolvedAvailableBalance = availableBalance ?? null

    if (type === 'withdraw') {
      const amt = Number(amount)
      if (amt < MIN_WITHDRAW_AMOUNT) {
        return res.status(400).json({ error: `Minimum withdraw is PKR ${MIN_WITHDRAW_AMOUNT}` })
      }

      if (isBpexchCashConfigured()) {
        try {
          const info = await getBpexchUserBalance(name.trim())
          const bal = Number(info.balance)
          resolvedAvailableBalance = bal
          if (!(bal > MIN_BALANCE_FOR_WITHDRAW)) {
            return res.status(400).json({
              error: `Withdraw nahi ho sakta — balance PKR ${MIN_BALANCE_FOR_WITHDRAW} se zyada hona chahiye (current: ${bal})`,
            })
          }
          if (amt > bal) {
            return res.status(400).json({
              error: `Amount balance se zyada nahi ho sakti (balance: PKR ${bal})`,
            })
          }
        } catch (err) {
          console.error('Withdraw balance check failed:', err)
          return res.status(502).json({
            error: `Balance check fail: ${err.message}`,
          })
        }
      }
    }

    const id = createTransactionId()
    const createdAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + config.requestTtlMs).toISOString()
    const screenshotPath = type === 'deposit' ? saveScreenshot(screenshot, id) : null

    db.prepare(`
      INSERT INTO transactions (
        id, type, status, amount,
        payment_method_id, payment_method_label,
        account_title, account_number, bank_name,
        screenshot_path,
        payout_account_title, payout_account_number,
        name, phone, available_balance,
        created_at, expires_at
      ) VALUES (
        @id, @type, 'pending', @amount,
        @paymentMethodId, @paymentMethodLabel,
        @accountTitle, @accountNumber, @bankName,
        @screenshotPath,
        @payoutAccountTitle, @payoutAccountNumber,
        @name, @phone, @availableBalance,
        @createdAt, @expiresAt
      )
    `).run({
      id,
      type,
      amount: Number(amount),
      paymentMethodId,
      paymentMethodLabel,
      accountTitle: accountTitle || '',
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      screenshotPath,
      payoutAccountTitle: payoutAccountTitle || '',
      payoutAccountNumber: payoutAccountNumber || '',
      name: name.trim(),
      phone: phone.trim(),
      availableBalance: resolvedAvailableBalance,
      createdAt,
      expiresAt,
    })

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    res.status(201).json(rowToTransaction(row))
  } catch (err) {
    console.error('Create transaction error:', err)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

router.get('/', (req, res) => {
  try {
    expirePendingTransactions()

    const phone = String(req.query.phone || '').trim()
    const name = String(req.query.name || req.query.username || '').trim()
    if (!phone && !name) {
      return res.status(400).json({ error: 'Phone or username is required' })
    }

    let rows
    if (phone && name) {
      rows = db
        .prepare(
          `
        SELECT * FROM transactions
        WHERE phone = ? OR name = ?
        ORDER BY created_at DESC
        LIMIT 100
      `,
        )
        .all(phone, name)
    } else if (name) {
      rows = db
        .prepare(
          `
        SELECT * FROM transactions
        WHERE name = ?
        ORDER BY created_at DESC
        LIMIT 100
      `,
        )
        .all(name)
    } else {
      rows = db
        .prepare(
          `
        SELECT * FROM transactions
        WHERE phone = ?
        ORDER BY created_at DESC
        LIMIT 100
      `,
        )
        .all(phone)
    }

    res.json(rows.map(rowToTransaction))
  } catch (err) {
    console.error('List transactions error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export default router
