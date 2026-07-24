import { Router } from 'express'
import { listWithdrawMethods } from '../db.js'

const router = Router()

/** Public — website & app withdraw method choices */
router.get('/', (_req, res) => {
  try {
    res.json(listWithdrawMethods())
  } catch (err) {
    console.error('List withdraw methods error:', err)
    res.status(500).json({ error: 'Failed to fetch withdraw methods' })
  }
})

export default router
