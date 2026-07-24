import { Router } from 'express'
import { getSupportContactConfig } from '../db.js'

const router = Router()

/** Public — dedicated BpxPro Support WhatsApp config */
router.get('/', (_req, res) => {
  try {
    const cfg = getSupportContactConfig()
    res.json({
      whatsapp: cfg.whatsapp,
      updatedAt: cfg.updatedAt,
      configured: cfg.configured,
    })
  } catch (err) {
    console.error('Get support contact error:', err)
    res.status(500).json({ error: 'Failed to fetch support contact' })
  }
})

export default router
