import { Router } from 'express'
import { db, rowToBpexchUser, getBpexchAgentConfig } from '../db.js'
import { createBpexchBettorAccount, hasAgentCredentials } from '../services/bpexchRegister.js'

const router = Router()

function slugFromName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10)
}

/** Auto username: name/phone based, unique in local DB. */
function generateUniqueUsername({ name, phone } = {}) {
  const digits = String(phone || '').replace(/\D/g, '')
  const phoneTail = digits.slice(-4) || String(Math.floor(1000 + Math.random() * 9000))
  let base = slugFromName(name)
  if (base.length < 3) base = 'bpx'

  for (let i = 0; i < 40; i++) {
    const suffix =
      i === 0 ? phoneTail : String(Math.floor(1000 + Math.random() * 9000))
    const username = `${base}${suffix}`.slice(0, 20)
    if (username.length < 4) continue
    const existing = db
      .prepare('SELECT id FROM bpexch_users WHERE lower(username) = lower(?)')
      .get(username)
    if (!existing) return username
  }

  return `bpx${Date.now().toString(36)}`
}

function saveLocalUser({ username, password, phone, name, reference }) {
  const now = new Date().toISOString()
  const notes = name ? `Self-register: ${name}` : 'Self-register'
  const agentUsername = getBpexchAgentConfig().username || ''
  db.prepare(`
    INSERT INTO bpexch_users (
      username, password, user_type, is_active, phone,
      reference, notes, parent_id, source, agent_username, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    username,
    password,
    'Bettor',
    1,
    phone || '',
    reference || 'flowexch',
    notes,
    agentUsername,
    'self-register',
    agentUsername,
    now,
    now,
  )
  return db.prepare('SELECT * FROM bpexch_users WHERE username = ?').get(username)
}

router.get('/status', (_req, res) => {
  res.json({
    selfRegisterAvailable: hasAgentCredentials(),
  })
})

router.post('/', async (req, res) => {
  try {
    const password = String(req.body?.password || '').trim()
    const confirmPassword = String(req.body?.confirmPassword || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const name = String(req.body?.name || '').trim()
    const countryCode = String(req.body?.countryCode || 'PK').trim().toUpperCase()
    let username = String(req.body?.username || '').trim()

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }
    if (!phone || !/^[\d\s+\-()]{7,}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number' })
    }

    // Prefer system-generated ID; only keep client username if valid & free
    if (username) {
      if (username.length < 4 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
        return res.status(400).json({
          error: 'Username can only use letters, numbers, . _ - (min 4)',
        })
      }
      const existing = db
        .prepare('SELECT id FROM bpexch_users WHERE lower(username) = lower(?)')
        .get(username)
      if (existing) {
        return res.status(409).json({ error: 'Username already exists. Try another.' })
      }
    } else {
      username = generateUniqueUsername({ name, phone })
    }

    await createBpexchBettorAccount({
      username,
      password,
      phone,
      name,
      reference: `flowexch-${countryCode}`,
    })

    const row = saveLocalUser({
      username,
      password,
      phone,
      name,
      reference: `flowexch-${countryCode}`,
    })

    res.status(201).json({
      ok: true,
      user: rowToBpexchUser(row),
      loginPath: '/login',
      message: 'Account created on BPEXCH. You can log in now.',
    })
  } catch (err) {
    console.error('[register]', err.code || '', err.message)
    const status =
      err.code === 'NOT_CONFIGURED' || err.code === 'AGENT_NO_PERMISSION' ? 503 : 400
    res.status(status).json({
      error: err.message || 'Failed to create account',
      code: err.code || 'CREATE_FAILED',
      whatsappFallback: true,
    })
  }
})

export default router
