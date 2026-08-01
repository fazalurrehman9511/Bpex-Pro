import { Router } from 'express'
import { getHomepageContentConfig } from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  try {
    const cfg = getHomepageContentConfig()
    res.json({
      content: cfg.content,
      updatedAt: cfg.updatedAt,
      source: cfg.source,
    })
  } catch (err) {
    console.error('Get homepage content error:', err)
    res.status(500).json({ error: 'Failed to fetch homepage content' })
  }
})

export default router
