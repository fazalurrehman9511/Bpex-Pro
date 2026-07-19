import { Router } from 'express'
import { listWhatsappAgents } from '../db.js'

const router = Router()

/** Public — registration WhatsApp Agent countries */
router.get('/', (_req, res) => {
  try {
    res.json(listWhatsappAgents({ activeOnly: true }))
  } catch (err) {
    console.error('List WhatsApp agents error:', err)
    res.status(500).json({ error: 'Failed to fetch WhatsApp agents' })
  }
})

export default router
