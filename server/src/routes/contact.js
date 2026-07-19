import { Router } from 'express'
import { db } from '../db.js'
import { createTransactionId } from '../utils/id.js'

const router = Router()

router.post('/', (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body || {}

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, phone and message are required' })
    }
    if (!/^[\d\s+\-()]{7,}$/.test(String(phone).trim())) {
      return res.status(400).json({ error: 'Enter a valid phone number' })
    }
    if (String(message).trim().length < 10) {
      return res.status(400).json({ error: 'Message is too short' })
    }
    if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'Enter a valid email' })
    }

    const id = createTransactionId()
    const createdAt = new Date().toISOString()

    db.prepare(`
      INSERT INTO contact_messages (
        id, name, phone, email, subject, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      String(phone).trim(),
      String(email || '').trim(),
      String(subject || 'General inquiry').trim().slice(0, 120),
      String(message).trim().slice(0, 4000),
      createdAt
    )

    res.status(201).json({ ok: true, id })
  } catch (err) {
    console.error('[contact]', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
