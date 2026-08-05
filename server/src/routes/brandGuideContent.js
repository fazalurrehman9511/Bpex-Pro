import { Router } from 'express'
import { getBrandGuideContentConfig } from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  try {
    const cfg = getBrandGuideContentConfig()
    res.json({
      content: cfg.content,
      updatedAt: cfg.updatedAt,
      source: cfg.source,
    })
  } catch (err) {
    console.error('Get brand guide content error:', err)
    res.status(500).json({ error: 'Failed to fetch brand guide content' })
  }
})

export default router
