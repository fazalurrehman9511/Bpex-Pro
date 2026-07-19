import { Router } from 'express'
import crypto from 'crypto'
import { db, rowToBpexchUser, updateBpexchUserBalance, verifyBpexchUserForLogin, getBpexchAgentConfig } from '../db.js'
import { config } from '../config.js'
import { extractUserFromFields, normalizeUserType } from '../utils/bpexchUser.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  getBpexchBalancesForUsernames,
  isBpexchCashConfigured,
  listAllBpexchClients,
} from '../services/bpexchCash.js'

const router = Router()

function checkSyncSecret(req) {
  // Fail closed — never allow open sync in any environment
  if (!config.bpexchSyncSecret) return false
  const provided = String(req.headers['x-sync-secret'] || '')
  if (!provided || provided.length !== config.bpexchSyncSecret.length) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(config.bpexchSyncSecret)
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Public — app / web login must pass this before BPEXCH auth */
router.post('/verify', (req, res) => {
  try {
    const username = req.body?.username ?? req.body?.Username ?? req.body?.['user.Username']
    const password = req.body?.password ?? req.body?.Password ?? req.body?.['user.Password']
    const result = verifyBpexchUserForLogin({ username, password })
    if (!result.ok) {
      const status = result.code === 'missing_username' ? 400 : 403
      return res.status(status).json({
        ok: false,
        error: result.error,
        code: result.code,
      })
    }
    res.json({ ok: true, username: result.user.username, userType: result.user.userType })
  } catch (err) {
    console.error('Bpexch user verify error:', err)
    res.status(500).json({ ok: false, error: 'Verification failed' })
  }
})

function createUser(user, source = 'bpexch') {
  const now = new Date().toISOString()
  const agent = String(user.agentUsername || getBpexchAgentConfig().username || '').trim()
  db.prepare(`
    INSERT INTO bpexch_users (
      username, password, user_type, is_active, phone,
      reference, notes, parent_id, source, created_at, updated_at, agent_username
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.username,
    user.password,
    user.userType ?? 'Bettor',
    user.isActive != null ? (user.isActive ? 1 : 0) : 1,
    user.phone,
    user.reference,
    user.notes,
    user.parentId,
    source,
    now,
    now,
    agent,
  )
  return db.prepare('SELECT * FROM bpexch_users WHERE username = ?').get(user.username)
}

function updateExistingUser(user) {
  const existing = db.prepare('SELECT * FROM bpexch_users WHERE username = ?').get(user.username)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE bpexch_users SET
      password = COALESCE(NULLIF(?, ''), password),
      user_type = COALESCE(NULLIF(?, ''), user_type),
      is_active = COALESCE(?, is_active),
      phone = COALESCE(NULLIF(?, ''), phone),
      reference = COALESCE(NULLIF(?, ''), reference),
      notes = COALESCE(NULLIF(?, ''), notes),
      parent_id = COALESCE(NULLIF(?, ''), parent_id),
      updated_at = ?
    WHERE username = ?
  `).run(
    user.password,
    user.userType,
    user.isActive != null ? (user.isActive ? 1 : 0) : null,
    user.phone,
    user.reference,
    user.notes,
    user.parentId,
    now,
    user.username
  )

  return db.prepare('SELECT * FROM bpexch_users WHERE username = ?').get(user.username)
}

function upsertUser(user) {
  const existing = db.prepare('SELECT id FROM bpexch_users WHERE username = ?').get(user.username)
  if (existing) {
    return { row: updateExistingUser(user), isUpdate: true, skipped: false }
  }
  return { row: createUser(user), isUpdate: false, skipped: false }
}

router.post('/sync', (req, res) => {
  try {
    if (!config.bpexchSyncSecret) {
      return res.status(503).json({ error: 'BPEXCH sync secret is not configured on the server' })
    }
    if (!checkSyncSecret(req)) {
      return res.status(403).json({ error: 'Invalid sync secret' })
    }

    const mode = req.body?.mode === 'edit' ? 'edit' : 'create'
    const user = extractUserFromFields(req.body, mode)
    if (!user?.username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    if (mode === 'edit') {
      const row = updateExistingUser(user)
      if (!row) {
        console.log(`[bpexch-sync] Edit skipped — user not in DB: ${user.username}`)
        return res.status(404).json({ error: 'User not found in local database', username: user.username })
      }
      console.log(`[bpexch-sync] User updated: ${user.username}`)
      return res.json(rowToBpexchUser(row))
    }

    const { row, isUpdate } = upsertUser(user)
    console.log(`[bpexch-sync] User ${isUpdate ? 'updated' : 'created'}: ${user.username}`)
    res.status(isUpdate ? 200 : 201).json(rowToBpexchUser(row))
  } catch (err) {
    console.error('Bpexch user sync error:', err)
    res.status(500).json({ error: 'Failed to sync user' })
  }
})

router.get('/', requireAdmin, (req, res) => {
  try {
    const forActiveAgent = req.query.forActiveAgent !== '0' && req.query.all !== '1'
    const agent = getBpexchAgentConfig().username
    let rows
    if (forActiveAgent && agent) {
      rows = db
        .prepare(`
          SELECT * FROM bpexch_users
          WHERE lower(agent_username) = lower(?)
             OR (IFNULL(agent_username, '') = '' AND source IN ('self-register', 'manual'))
          ORDER BY created_at DESC
          LIMIT 2000
        `)
        .all(agent)
    } else {
      rows = db
        .prepare(`
          SELECT * FROM bpexch_users
          ORDER BY created_at DESC
          LIMIT 2000
        `)
        .all()
    }
    res.json(rows.map((row) => rowToBpexchUser(row, { includePassword: true })))
  } catch (err) {
    console.error('List bpexch users error:', err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.post('/sync-balances', requireAdmin, async (_req, res) => {
  try {
    if (!isBpexchCashConfigured()) {
      return res.status(503).json({ error: 'BPEXCH agent credentials are not configured' })
    }
    const agent = getBpexchAgentConfig().username
    const rows = agent
      ? db
          .prepare(`
            SELECT username FROM bpexch_users
            WHERE lower(agent_username) = lower(?)
               OR (IFNULL(agent_username, '') = '' AND source IN ('self-register', 'manual'))
            ORDER BY created_at DESC
            LIMIT 500
          `)
          .all(agent)
      : db
          .prepare(`
            SELECT username FROM bpexch_users
            ORDER BY created_at DESC
            LIMIT 500
          `)
          .all()
    const names = rows.map((r) => r.username)
    const map = await getBpexchBalancesForUsernames(names)
    let updated = 0
    for (const name of names) {
      const info = map.get(name.toLowerCase())
      if (!info || info.balance == null) continue
      updateBpexchUserBalance(name, {
        userId: info.userId,
        credit: info.credit,
        balance: info.balance,
        maxWithdraw: info.maxWithdraw,
      })
      updated += 1
    }
    const fresh = agent
      ? db
          .prepare(`
            SELECT * FROM bpexch_users
            WHERE lower(agent_username) = lower(?)
               OR (IFNULL(agent_username, '') = '' AND source IN ('self-register', 'manual'))
            ORDER BY created_at DESC
            LIMIT 500
          `)
          .all(agent)
      : db
          .prepare(`
            SELECT * FROM bpexch_users
            ORDER BY created_at DESC
            LIMIT 500
          `)
          .all()
    res.json({
      agentUsername: agent || '',
      total: names.length,
      updated,
      users: fresh.map((row) => rowToBpexchUser(row, { includePassword: true })),
    })
  } catch (err) {
    console.error('Sync balances error:', err)
    res.status(502).json({ error: err.message || 'Failed to sync BPEXCH balances' })
  }
})
/** Import all downline clients from BPEXCH Clients List into local users table. */
router.post('/sync-from-bpexch', requireAdmin, async (req, res) => {
  try {
    if (!isBpexchCashConfigured()) {
      return res.status(503).json({ error: 'BPEXCH agent credentials are not configured' })
    }

    const agentUsername = getBpexchAgentConfig().username
    const withBalances = req.body?.withBalances !== false
    const clients = await listAllBpexchClients()
    const now = new Date().toISOString()
    let created = 0
    let updated = 0

    const findByUsername = db.prepare(
      'SELECT * FROM bpexch_users WHERE lower(username) = lower(?)',
    )
    const insert = db.prepare(`
      INSERT INTO bpexch_users (
        username, password, user_type, is_active, phone,
        reference, notes, parent_id, source, bpexch_id,
        agent_username, created_at, updated_at
      ) VALUES (?, '', 'Bettor', ?, '', '', '', ?, 'bpexch', ?, ?, ?, ?)
    `)
    const patch = db.prepare(`
      UPDATE bpexch_users SET
        bpexch_id = ?,
        is_active = ?,
        agent_username = ?,
        parent_id = CASE WHEN IFNULL(parent_id, '') = '' THEN ? ELSE parent_id END,
        updated_at = ?,
        source = CASE WHEN source = 'manual' THEN source ELSE 'bpexch' END
      WHERE id = ?
    `)

    const syncTx = db.transaction((list) => {
      for (const client of list) {
        const existing = findByUsername.get(client.username)
        if (existing) {
          patch.run(
            client.userId,
            client.isActive ? 1 : 0,
            agentUsername,
            agentUsername,
            now,
            existing.id,
          )
          updated += 1
        } else {
          insert.run(
            client.username,
            client.isActive ? 1 : 0,
            agentUsername,
            client.userId,
            agentUsername,
            now,
            now,
          )
          created += 1
        }
      }
    })
    syncTx(clients)

    let balancesUpdated = 0
    if (withBalances && clients.length) {
      const map = await getBpexchBalancesForUsernames(clients.map((c) => c.username))
      for (const client of clients) {
        const info = map.get(client.username.toLowerCase())
        if (!info || info.balance == null) continue
        updateBpexchUserBalance(client.username, {
          userId: info.userId || client.userId,
          credit: info.credit,
          balance: info.balance,
          maxWithdraw: info.maxWithdraw,
        })
        balancesUpdated += 1
      }
    }

    const fresh = agentUsername
      ? db
          .prepare(`
            SELECT * FROM bpexch_users
            WHERE lower(agent_username) = lower(?)
               OR (IFNULL(agent_username, '') = '' AND source IN ('self-register', 'manual'))
            ORDER BY created_at DESC
            LIMIT 2000
          `)
          .all(agentUsername)
      : db
          .prepare(`
            SELECT * FROM bpexch_users
            ORDER BY created_at DESC
            LIMIT 2000
          `)
          .all()

    console.log(
      `[bpexch-admin] Synced clients for agent=${agentUsername}: created=${created} updated=${updated} balances=${balancesUpdated}`,
    )

    res.json({
      agentUsername,
      fetched: clients.length,
      created,
      updated,
      balancesUpdated,
      users: fresh.map((row) => rowToBpexchUser(row, { includePassword: true })),
    })
  } catch (err) {
    console.error('Sync from BPEXCH error:', err)
    res.status(502).json({ error: err.message || 'Failed to sync users from BPEXCH' })
  }
})

/**
 * Import clients scraped from BPEXCH on an admin's PC (bypasses Cloudflare on hosting IP).
 * Body: { clients: [{ userId, username, isActive }], agentUsername? }
 */
router.post('/import-clients', requireAdmin, (req, res) => {
  try {
    const clients = Array.isArray(req.body?.clients) ? req.body.clients : []
    if (!clients.length) {
      return res.status(400).json({ error: 'clients array is required' })
    }

    const agentUsername =
      String(req.body?.agentUsername || getBpexchAgentConfig().username || '').trim()
    if (!agentUsername) {
      return res.status(400).json({
        error: 'agentUsername required — pehle admin mein Agent save karo',
      })
    }

    const now = new Date().toISOString()
    let created = 0
    let updated = 0
    let skipped = 0

    const findByUsername = db.prepare(
      'SELECT * FROM bpexch_users WHERE lower(username) = lower(?)',
    )
    const insert = db.prepare(`
      INSERT INTO bpexch_users (
        username, password, user_type, is_active, phone,
        reference, notes, parent_id, source, bpexch_id,
        agent_username, created_at, updated_at
      ) VALUES (?, '', 'Bettor', ?, '', '', '', ?, 'bpexch', ?, ?, ?, ?)
    `)
    const patch = db.prepare(`
      UPDATE bpexch_users SET
        bpexch_id = COALESCE(?, bpexch_id),
        is_active = COALESCE(?, is_active),
        agent_username = ?,
        parent_id = CASE WHEN IFNULL(parent_id, '') = '' THEN ? ELSE parent_id END,
        updated_at = ?,
        source = CASE WHEN source = 'manual' THEN source ELSE 'bpexch' END
      WHERE id = ?
    `)

    const syncTx = db.transaction((list) => {
      for (const raw of list) {
        const username = String(raw?.username || '').trim()
        if (!username) {
          skipped += 1
          continue
        }
        const userId = raw?.userId != null ? String(raw.userId).trim() : null
        const isActive = raw?.isActive === false || raw?.is_active === false ? 0 : 1
        const existing = findByUsername.get(username)
        if (existing) {
          patch.run(userId, isActive, agentUsername, agentUsername, now, existing.id)
          updated += 1
        } else {
          insert.run(username, isActive, agentUsername, userId, agentUsername, now, now)
          created += 1
        }
      }
    })
    syncTx(clients)

    const fresh = db
      .prepare(`
        SELECT * FROM bpexch_users
        WHERE lower(agent_username) = lower(?)
           OR (IFNULL(agent_username, '') = '' AND source IN ('self-register', 'manual'))
        ORDER BY created_at DESC
        LIMIT 2000
      `)
      .all(agentUsername)

    console.log(
      `[bpexch-admin] PC import for agent=${agentUsername}: created=${created} updated=${updated} skipped=${skipped}`,
    )

    res.json({
      ok: true,
      agentUsername,
      fetched: clients.length,
      created,
      updated,
      skipped,
      users: fresh.map((row) => rowToBpexchUser(row, { includePassword: true })),
    })
  } catch (err) {
    console.error('Import clients error:', err)
    res.status(500).json({ error: err.message || 'Failed to import clients' })
  }
})

router.post('/', requireAdmin, (req, res) => {
  try {
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '').trim()

    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const existing = db.prepare('SELECT id FROM bpexch_users WHERE username = ?').get(username)
    if (existing) {
      return res.status(409).json({ error: 'Username already exists in database' })
    }

    const user = {
      username,
      password,
      userType: normalizeUserType(req.body?.userType || req.body?.user_type || 'Bettor'),
      isActive: req.body?.isActive !== false && req.body?.is_active !== false,
      phone: String(req.body?.phone || '').trim(),
      reference: String(req.body?.reference || '').trim(),
      notes: String(req.body?.notes || '').trim(),
      parentId: String(req.body?.parentId || req.body?.parent_id || '').trim(),
    }

    const row = createUser(user, 'manual')
    console.log(`[bpexch-admin] User manually added: ${user.username}`)
    res.status(201).json(rowToBpexchUser(row, { includePassword: true }))
  } catch (err) {
    console.error('Manual bpexch user create error:', err)
    res.status(500).json({ error: 'Failed to save user' })
  }
})

export default router
