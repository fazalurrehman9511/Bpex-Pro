import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
  db,
  expirePendingTransactions,
  rowToTransaction,
  listPaymentAccounts,
  updatePaymentAccount,
  createPaymentAccount,
  deletePaymentAccount,
  listWhatsappAgents,
  updateWhatsappAgent,
  createWhatsappAgent,
  deleteWhatsappAgent,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getProfitLossSummary,
  updateBpexchUserBalance,
  getBpexchAgentConfig,
  updateBpexchAgentConfig,
} from '../db.js'
import { config } from '../config.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  depositCashToBpexchUser,
  withdrawCashFromBpexchUser,
  isBpexchCashConfigured,
} from '../services/bpexchCash.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!config.adminPassword) {
    return res.status(503).json({ error: 'Admin credentials are not configured on the server' })
  }
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }
  if (
    username.trim() !== config.adminUsername ||
    password !== config.adminPassword
  ) {
    return res.status(401).json({ error: 'Incorrect username or password' })
  }

  const token = jwt.sign(
    { role: 'superadmin', username: config.adminUsername },
    config.jwtSecret,
    { expiresIn: '24h' }
  )
  res.json({ token, username: config.adminUsername })
})

router.get('/transactions', requireAdmin, (req, res) => {
  try {
    expirePendingTransactions()

    const { type, status } = req.query
    let sql = 'SELECT * FROM transactions WHERE 1=1'
    const params = []

    if (type && type !== 'all') {
      sql += ' AND type = ?'
      params.push(type)
    }
    if (status && status !== 'all') {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT 500'

    const rows = db.prepare(sql).all(...params)
    res.json(rows.map(rowToTransaction))
  } catch (err) {
    console.error('Admin list error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

router.patch('/transactions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNotes } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' })
    }

    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    if (existing.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending transactions can be updated' })
    }

    let notes = adminNotes?.trim() || ''
    let bpexchMeta = null

    if (status === 'approved') {
      if (!isBpexchCashConfigured()) {
        return res.status(503).json({
          error:
            'BPEXCH agent not configured. Set BPEXCH_AGENT_USERNAME / BPEXCH_AGENT_PASSWORD to auto-credit.',
        })
      }

      const bpexchUsername = String(existing.name || '').trim()
      if (!bpexchUsername) {
        return res.status(400).json({
          error: 'Transaction has no BPEXCH username (name). Cannot credit on BPEXCH.',
        })
      }

      try {
        if (existing.type === 'deposit') {
          bpexchMeta = await depositCashToBpexchUser({
            username: bpexchUsername,
            amount: existing.amount,
            description: `Cash deposit in ${bpexchUsername} (FlowExch ${existing.id})`,
          })
          notes = [notes, `BPEXCH cash +${existing.amount} → ${bpexchUsername} (id ${bpexchMeta.userId})`]
            .filter(Boolean)
            .join(' | ')
        } else if (existing.type === 'withdraw') {
          bpexchMeta = await withdrawCashFromBpexchUser({
            username: bpexchUsername,
            amount: existing.amount,
            description: `Cash withdrawn from ${bpexchUsername} (FlowExch ${existing.id})`,
          })
          notes = [notes, `BPEXCH cash -${existing.amount} ← ${bpexchUsername} (id ${bpexchMeta.userId})`]
            .filter(Boolean)
            .join(' | ')
        }
      } catch (err) {
        console.error('BPEXCH cash sync failed:', err)
        return res.status(502).json({
          error: `BPEXCH pe amount add/cut nahi hua: ${err.message}`,
        })
      }

      if (bpexchMeta && bpexchUsername) {
        updateBpexchUserBalance(bpexchUsername, {
          userId: bpexchMeta.userId,
          credit: bpexchMeta.credit,
          balance: bpexchMeta.balance,
          maxWithdraw: bpexchMeta.maxWithdraw,
        })
      }
    }

    const reviewedAt = new Date().toISOString()
    db.prepare(`
      UPDATE transactions
      SET status = ?, admin_notes = ?, reviewed_at = ?
      WHERE id = ?
    `).run(status, notes || null, reviewedAt, id)

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    res.json({
      ...rowToTransaction(row),
      bpexch: bpexchMeta,
    })
  } catch (err) {
    console.error('Admin update error:', err)
    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

router.get('/payment-accounts', requireAdmin, (_req, res) => {
  try {
    res.json(listPaymentAccounts())
  } catch (err) {
    console.error('Admin payment accounts error:', err)
    res.status(500).json({ error: 'Failed to fetch payment accounts' })
  }
})

router.put('/payment-accounts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params
    const { accountTitle, accountNumber, bankName, label } = req.body
    if (!accountTitle?.trim() || !accountNumber?.trim()) {
      return res.status(400).json({ error: 'Account title and number are required' })
    }
    const updated = updatePaymentAccount(id, {
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName?.trim() || '',
      label: label?.trim(),
    })
    if (!updated) {
      return res.status(404).json({ error: 'Payment account not found' })
    }
    res.json(updated)
  } catch (err) {
    console.error('Admin update payment account error:', err)
    res.status(500).json({ error: 'Failed to update payment account' })
  }
})

router.post('/payment-accounts', requireAdmin, (req, res) => {
  try {
    const { id, label, accountTitle, accountNumber, bankName } = req.body
    if (!label?.trim()) {
      return res.status(400).json({ error: 'Label is required' })
    }
    if (!accountTitle?.trim() || !accountNumber?.trim()) {
      return res.status(400).json({ error: 'Account title and number are required' })
    }
    const created = createPaymentAccount({
      id: id?.trim() || label.trim(),
      label: label.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName?.trim() || '',
    })
    res.status(201).json(created)
  } catch (err) {
    const msg = err.message || 'Failed to add payment account'
    const status = /already exists|required|Id must|lowercase/i.test(msg) ? 400 : 500
    if (status === 500) console.error('Admin create payment account error:', err)
    res.status(status).json({ error: msg })
  }
})

router.delete('/payment-accounts/:id', requireAdmin, (req, res) => {
  try {
    const removed = deletePaymentAccount(req.params.id)
    if (!removed) {
      return res.status(404).json({ error: 'Payment account not found' })
    }
    res.json({ ok: true, id: req.params.id })
  } catch (err) {
    console.error('Admin delete payment account error:', err)
    res.status(500).json({ error: 'Failed to delete payment account' })
  }
})

router.get('/whatsapp-agents', requireAdmin, (_req, res) => {
  try {
    res.json(listWhatsappAgents({ activeOnly: false }))
  } catch (err) {
    console.error('Admin WhatsApp agents error:', err)
    res.status(500).json({ error: 'Failed to fetch WhatsApp agents' })
  }
})

router.post('/whatsapp-agents', requireAdmin, (req, res) => {
  try {
    const { code, name, flag, dialCode, phonePlaceholder, whatsapp, isActive, sortOrder } = req.body
    if (!code?.trim()) {
      return res.status(400).json({ error: 'Country code is required (e.g. US)' })
    }
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Country name is required' })
    }
    if (!whatsapp?.trim()) {
      return res.status(400).json({ error: 'WhatsApp number is required' })
    }
    const cleaned = String(whatsapp).replace(/[^\d]/g, '')
    if (cleaned.length < 8) {
      return res.status(400).json({ error: 'Enter a valid WhatsApp number (digits with country code)' })
    }
    const created = createWhatsappAgent({
      code,
      name: name.trim(),
      flag: flag?.trim() || '',
      dialCode: dialCode?.trim() || '',
      phonePlaceholder: phonePlaceholder?.trim() || '',
      whatsapp: cleaned,
      isActive,
      sortOrder: sortOrder == null ? undefined : Number(sortOrder),
    })
    res.status(201).json(created)
  } catch (err) {
    const msg = err.message || 'Failed to add WhatsApp agent'
    const status = /already exists|2 letters|required|valid/i.test(msg) ? 400 : 500
    if (status === 500) console.error('Admin create WhatsApp agent error:', err)
    res.status(status).json({ error: msg })
  }
})

router.put('/whatsapp-agents/:code', requireAdmin, (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase()
    const { name, flag, dialCode, phonePlaceholder, whatsapp, isActive, sortOrder } = req.body
    if (!whatsapp?.trim()) {
      return res.status(400).json({ error: 'WhatsApp number is required' })
    }
    const cleaned = String(whatsapp).replace(/[^\d]/g, '')
    if (cleaned.length < 8) {
      return res.status(400).json({ error: 'Enter a valid WhatsApp number (digits with country code)' })
    }
    const updated = updateWhatsappAgent(code, {
      name: name?.trim(),
      flag: flag?.trim(),
      dialCode: dialCode?.trim(),
      phonePlaceholder: phonePlaceholder?.trim(),
      whatsapp: cleaned,
      isActive,
      sortOrder: sortOrder == null ? undefined : Number(sortOrder),
    })
    if (!updated) {
      return res.status(404).json({ error: 'Country / agent not found' })
    }
    res.json(updated)
  } catch (err) {
    console.error('Admin update WhatsApp agent error:', err)
    res.status(500).json({ error: 'Failed to update WhatsApp agent' })
  }
})

router.delete('/whatsapp-agents/:code', requireAdmin, (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase()
    const removed = deleteWhatsappAgent(code)
    if (!removed) {
      return res.status(404).json({ error: 'Country / agent not found' })
    }
    res.json({ ok: true, code })
  } catch (err) {
    console.error('Admin delete WhatsApp agent error:', err)
    res.status(500).json({ error: 'Failed to delete WhatsApp agent' })
  }
})

router.get('/expenses', requireAdmin, (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query
    res.json(
      listExpenses({
        dateFrom: dateFrom ? String(dateFrom).slice(0, 10) : undefined,
        dateTo: dateTo ? String(dateTo).slice(0, 10) : undefined,
      }),
    )
  } catch (err) {
    console.error('Admin expenses error:', err)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

router.post('/expenses', requireAdmin, (req, res) => {
  try {
    const created = createExpense(req.body || {})
    res.status(201).json(created)
  } catch (err) {
    const msg = err.message || 'Failed to add expense'
    const status = /required|valid/i.test(msg) ? 400 : 500
    if (status === 500) console.error('Admin create expense error:', err)
    res.status(status).json({ error: msg })
  }
})

router.put('/expenses/:id', requireAdmin, (req, res) => {
  try {
    const updated = updateExpense(req.params.id, req.body || {})
    if (!updated) return res.status(404).json({ error: 'Expense not found' })
    res.json(updated)
  } catch (err) {
    const msg = err.message || 'Failed to update expense'
    const status = /required|valid/i.test(msg) ? 400 : 500
    if (status === 500) console.error('Admin update expense error:', err)
    res.status(status).json({ error: msg })
  }
})

router.delete('/expenses/:id', requireAdmin, (req, res) => {
  try {
    const removed = deleteExpense(req.params.id)
    if (!removed) return res.status(404).json({ error: 'Expense not found' })
    res.json({ ok: true, id: req.params.id })
  } catch (err) {
    console.error('Admin delete expense error:', err)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

router.get('/profit-loss', requireAdmin, (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query
    res.json(
      getProfitLossSummary({
        dateFrom: dateFrom ? String(dateFrom).slice(0, 10) : undefined,
        dateTo: dateTo ? String(dateTo).slice(0, 10) : undefined,
      }),
    )
  } catch (err) {
    console.error('Admin profit-loss error:', err)
    res.status(500).json({ error: 'Failed to fetch profit & loss' })
  }
})

router.get('/bpexch-agent', requireAdmin, (_req, res) => {
  try {
    const cfg = getBpexchAgentConfig()
    res.json({
      username: cfg.username,
      label: cfg.label,
      updatedAt: cfg.updatedAt,
      source: cfg.source,
      configured: cfg.configured,
      hasPassword: Boolean(cfg.password),
    })
  } catch (err) {
    console.error('Admin get BPEXCH agent error:', err)
    res.status(500).json({ error: 'Failed to fetch BPEXCH agent config' })
  }
})

router.put('/bpexch-agent', requireAdmin, (req, res) => {
  try {
    const updated = updateBpexchAgentConfig({
      username: req.body?.username,
      password: req.body?.password,
      label: req.body?.label,
    })
    res.json({
      username: updated.username,
      label: updated.label,
      updatedAt: updated.updatedAt,
      source: updated.source,
      configured: updated.configured,
      hasPassword: Boolean(updated.password),
    })
  } catch (err) {
    const msg = err.message || 'Failed to update BPEXCH agent'
    const status = /required/i.test(msg) ? 400 : 500
    if (status === 500) console.error('Admin update BPEXCH agent error:', err)
    res.status(status).json({ error: msg })
  }
})

export default router
