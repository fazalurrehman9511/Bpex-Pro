import { Router } from 'express'
import { listPaymentAccounts } from '../db.js'

const router = Router()

/** Public — app & website deposit screens */
router.get('/', (_req, res) => {
  try {
    res.json(listPaymentAccounts())
  } catch (err) {
    console.error('List payment accounts error:', err)
    res.status(500).json({ error: 'Failed to fetch payment accounts' })
  }
})

export default router
