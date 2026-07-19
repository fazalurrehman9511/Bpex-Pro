import { Router } from 'express'
import { getLiveEvents, normalizeMarketsPayload } from '../services/bpexchLive.js'

const router = Router()

/** Public live events for homepage — cached BPEXCH markets */
router.get('/', async (req, res) => {
  try {
    const force = req.query.refresh === '1'
    const data = await getLiveEvents({ force })
    res.json({
      events: data.events.map(({ _normalized, ...e }) => e),
      updatedAt: data.updatedAt,
      source: data.source,
      error: null,
      hasCredentials: !!data.hasCredentials,
    })
  } catch (err) {
    console.warn('[live-events] route error:', err.message)
    res.json({
      events: [],
      updatedAt: Date.now(),
      source: 'none',
      error: null,
      hasCredentials: false,
    })
  }
})

/** Normalize a raw Markets[] payload (e.g. from browser session) */
router.post('/normalize', (req, res) => {
  try {
    const events = normalizeMarketsPayload(req.body)
    res.json({ events, updatedAt: Date.now(), source: 'client' })
  } catch (err) {
    res.status(400).json({ events: [], error: err.message })
  }
})

export default router
