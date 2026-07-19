export function isUserEditPath(pathname = '') {
  const path = pathname.toLowerCase()
  if (/login|authenticate|logout|signin/.test(path)) return false
  return path.includes('/users/') && /edit|update|modify/.test(path)
}

export function isUserCreatePath(pathname = '') {
  const path = pathname.toLowerCase()
  if (/login|authenticate|logout|signin/.test(path)) return false
  if (isUserEditPath(pathname)) return false
  if (path.includes('/users/') && /create|add|insert|register|newuser/.test(path)) {
    return true
  }
  if (/\/api\/users\/?$/.test(path) || /\/users\/?$/.test(path)) return true
  return false
}

export function getSyncModeFromPath(pathname = '') {
  return isUserEditPath(pathname) ? 'edit' : 'create'
}

function normalizeFieldKey(key) {
  const raw = String(key).trim()
  const lastPart = raw.includes('.') ? raw.split('.').pop() : raw
  return lastPart.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function parseBodyFields(body, contentType = '') {
  if (!body) return {}

  if (typeof body === 'object' && !(body instanceof Buffer) && !Array.isArray(body)) {
    return { ...body }
  }

  const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body)
  if (!text.trim()) return {}

  if (contentType.includes('json') || text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      return {}
    }
  }

  const params = new URLSearchParams(text)
  const out = {}
  for (const [key, value] of params.entries()) {
    out[key] = value
  }
  return out
}

function buildFieldMap(fields) {
  const map = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '') continue
    map[normalizeFieldKey(key)] = value
  }
  return map
}

export function normalizeUserType(value) {
  const v = String(value ?? '').trim()
  if (v === '4') return 'Bettor'
  if (v === '3') return 'Admin'
  if (v === '2') return 'Master'
  if (v === '1') return 'SuperMaster'
  if (/supermaster/i.test(v)) return 'SuperMaster'
  if (/^master$/i.test(v)) return 'Master'
  if (/bettor|client|player/i.test(v)) return 'Bettor'
  if (/^admin$/i.test(v)) return 'Admin'
  return v || 'Bettor'
}

/** Returns null on edit when type field missing — preserves existing DB value. */
export function parseUserType(map, mode = 'create') {
  if (!map || typeof map !== 'object') return mode === 'edit' ? null : 'Bettor'

  const raw = map.usertype ?? map.accounttype ?? map.role ?? map.usertypeid
  if (raw == null || raw === '') return mode === 'edit' ? null : 'Bettor'

  return normalizeUserType(raw)
}

function parseBooleanish(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (/^(true|1|on|yes|y|active|enabled|open|unlocked)$/.test(v)) return true
  if (/^(false|0|off|no|n|inactive|disabled|locked|blocked|suspended|closed)$/.test(v)) return false
  return null
}

/** Parse BPEXCH active/inactive — returns null when unknown (edit: keep existing). */
export function parseIsActive(map, mode = 'create') {
  if (!map || typeof map !== 'object') return mode === 'edit' ? null : true

  const direct = map.isactive ?? map.active ?? map.accountactive
  if (direct != null && direct !== '') {
    const parsed = parseBooleanish(direct)
    if (parsed != null) return parsed
  }

  const enabled = map.enabled
  if (enabled != null && enabled !== '') {
    const parsed = parseBooleanish(enabled)
    if (parsed != null) return parsed
  }

  const inactive = map.isinactive ?? map.inactive
  if (inactive != null && inactive !== '') {
    const parsed = parseBooleanish(inactive)
    if (parsed != null) return !parsed
  }

  const locked = map.islocked ?? map.locked ?? map.isdisabled ?? map.disabled
  if (locked != null && locked !== '') {
    const parsed = parseBooleanish(locked)
    if (parsed != null) return !parsed
  }

  const suspended = map.issuspended ?? map.suspended ?? map.isblocked ?? map.blocked
  if (suspended != null && suspended !== '') {
    const parsed = parseBooleanish(suspended)
    if (parsed != null) return !parsed
  }

  const statusRaw = map.userstatus ?? map.accountstatus ?? map.status
  if (statusRaw != null && statusRaw !== '') {
    const v = String(statusRaw).trim().toLowerCase()
    if (/active|enabled|open|unlocked|yes|true|on/.test(v)) return true
    if (/inactive|disabled|locked|blocked|suspended|closed|no|false|off/.test(v)) return false
  }

  return mode === 'edit' ? null : true
}

export function extractUserFromFields(fields, mode = 'create') {
  if (!fields || typeof fields !== 'object') return null

  const map = buildFieldMap(fields)

  let username =
    map.username ||
    map.loginname ||
    map.login ||
    map.user

  if (!username && map.userid && !/^\d+$/.test(String(map.userid).trim())) {
    username = map.userid
  }

  if (!username) return null

  const password = map.password || map.pass || map.userpassword || ''
  if (!password && mode === 'create') return null

  const isActive = parseIsActive(map, mode)

  const userType = parseUserType(map, mode)

  return {
    username: String(username).trim(),
    password: String(password).trim(),
    userType: userType != null ? String(userType).trim() : null,
    isActive,
    phone: String(map.phone || map.mobile || map.mobileno || map.phonenumber || '').trim(),
    reference: String(map.reference || map.ref || '').trim(),
    notes: String(map.notes || map.note || map.remarks || map.comment || '').trim(),
    parentId: String(map.parentid || map.masterid || map.parent || map.agentid || '').trim(),
  }
}

export function looksLikeUserSyncFields(fields, mode = 'create') {
  return Boolean(extractUserFromFields(fields, mode))
}

export function extractUserFromRequest(pathname, body, contentType) {
  const mode = getSyncModeFromPath(pathname)
  const fields = parseBodyFields(body, contentType)
  if (!looksLikeUserSyncFields(fields, mode)) return null

  const path = pathname.toLowerCase()
  if (/login|authenticate|logout|signin/.test(path)) return null

  const user = extractUserFromFields(fields, mode)
  if (!user) return null

  return { user, mode }
}

export function extractUserFromFormFields(fields, mode = 'create') {
  return extractUserFromFields(fields, mode)
}
