import { Router } from 'express'
import { getResponsibleGamingContentConfig } from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  try {
    const cfg = getResponsibleGamingContentConfig()
    res.json({
      content: cfg.content,
      updatedAt: cfg.updatedAt,
      source: cfg.source,
    })
  } catch (err) {
    console.error('Get responsible gaming content error:', err)
    res.status(500).json({ error: 'Failed to fetch responsible gaming content' })
  }
})

export default router
