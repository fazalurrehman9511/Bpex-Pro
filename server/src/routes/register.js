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

function randomFourDigits() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function buildAutoUsername(name, suffix) {
  const serial = String(suffix || '').replace(/\D/g, '').slice(-4) || randomFourDigits()
  let base = slugFromName(name)
  if (base.endsWith('bpx')) base = base.slice(0, -3)
  if (base.length < 3) base = 'user'

  const maxBaseLength = Math.max(1, 20 - 'bpx'.length - serial.length)
  return `${base.slice(0, maxBaseLength)}bpx${serial}`
}

/** Auto username: name/phone based, unique in local DB. */
function generateUniqueUsername({ name, phone } = {}, reserved = new Set()) {
  const digits = String(phone || '').replace(/\D/g, '')
  const phoneTail = digits.slice(-4)
  for (let i = 0; i < 40; i++) {
    const suffix = i === 0 && phoneTail.length === 4 ? phoneTail : randomFourDigits()
    const username = buildAutoUsername(name, suffix)
    const key = username.toLowerCase()
    if (reserved.has(key)) continue
    const existing = db
      .prepare('SELECT id FROM bpexch_users WHERE lower(username) = lower(?)')
      .get(username)
    if (!existing) return username
    reserved.add(key)
  }

  return buildAutoUsername(name, String(Date.now()).slice(-4))
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
    const requestedUsername = String(req.body?.username || '').trim()
    const isAutoUsername = !requestedUsername
    let username = requestedUsername

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
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
    }

    const reservedUsernames = new Set()
    const maxAutoAttempts = isAutoUsername ? 8 : 1
    let createdUsername = ''

    for (let attempt = 0; attempt < maxAutoAttempts; attempt += 1) {
      const candidate = isAutoUsername
        ? generateUniqueUsername({ name, phone }, reservedUsernames)
        : username

      reservedUsernames.add(candidate.toLowerCase())

      try {
        await createBpexchBettorAccount({
          username: candidate,
          password,
          phone,
          name,
          reference: `flowexch-${countryCode}`,
        })
        createdUsername = candidate
        break
      } catch (err) {
        if (isAutoUsername && err?.code === 'USERNAME_EXISTS' && attempt < maxAutoAttempts - 1) {
          continue
        }
        throw err
      }
    }

    if (!createdUsername) {
      const err = new Error('Could not generate an available BPEXCH username. Please try again.')
      err.code = 'USERNAME_EXISTS'
      throw err
    }

    const row = saveLocalUser({
      username: createdUsername,
      password,
      phone,
      name,
      reference: `flowexch-${countryCode}`,
    })

    res.status(201).json({
      ok: true,
      user: rowToBpexchUser(row, { includePassword: true }),
      loginPath: '/login',
      message: 'Account created on BPEXCH. You can log in now.',
    })
  } catch (err) {
    console.error('[register]', err.code || '', err.message)
    const status =
      err.code === 'NOT_CONFIGURED' || err.code === 'AGENT_NO_PERMISSION'
        ? 503
        : err.code === 'USERNAME_EXISTS'
          ? 409
          : 400
    res.status(status).json({
      error: err.message || 'Failed to create account',
      code: err.code || 'CREATE_FAILED',
      whatsappFallback: true,
    })
  }
})

export default router
