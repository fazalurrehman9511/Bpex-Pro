import { Capacitor } from '@capacitor/core'

function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  try {
    if (Capacitor.isNativePlatform()) {
      const native = (import.meta.env.VITE_NATIVE_API_URL || '').trim().replace(/\/$/, '')
      if (native) return native
      // Same site as production web when native API is not set
      const site = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/$/, '')
      if (site) return site
    }
  } catch {
    /* ignore */
  }
  return ''
}

const API_BASE = resolveApiBase()
const TOKEN_KEY = 'flowexch_admin_token'
const USER_PHONE_KEY = 'flowexch_user_phone'

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function setUserPhone(phone) {
  sessionStorage.setItem(USER_PHONE_KEY, phone.trim())
}

export function getUserPhone() {
  return sessionStorage.getItem(USER_PHONE_KEY) || ''
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getAdminToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const url = `${API_BASE}${path}`
  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (err) {
    const base = API_BASE || window.location.origin
    throw new Error(
      `API connect nahi hui (${base}). Phone + Mac same Wi‑Fi rakho, server chal raha ho.`,
    )
  }
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

export async function createTransaction(payload) {
  return apiFetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchUserTransactions({ phone, username } = {}) {
  const params = new URLSearchParams()
  if (phone?.trim()) params.set('phone', phone.trim())
  if (username?.trim()) params.set('name', username.trim())
  if (![...params.keys()].length) {
    throw new Error('Phone or username is required')
  }
  return apiFetch(`/api/transactions?${params}`)
}

export async function adminLogin(username, password) {
  const data = await apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAdminToken(data.token)
  return data
}

export async function fetchAdminTransactions(filters = {}) {
  const params = new URLSearchParams()
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  const qs = params.toString()
  return apiFetch(`/api/admin/transactions${qs ? `?${qs}` : ''}`)
}

export async function updateAdminTransaction(id, status, adminNotes = '') {
  return apiFetch(`/api/admin/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNotes }),
  })
}

export async function fetchBpexchUsers() {
  return apiFetch('/api/bpexch/users')
}

export async function syncBpexchUserBalances() {
  return apiFetch('/api/bpexch/users/sync-balances', { method: 'POST' })
}

export async function syncBpexchUsersFromBpexch(options = {}) {
  return apiFetch('/api/bpexch/users/sync-from-bpexch', {
    method: 'POST',
    body: JSON.stringify({ withBalances: options.withBalances !== false }),
  })
}

export async function fetchBpexchBalance(username) {
  const params = new URLSearchParams({ username: String(username || '').trim() })
  return apiFetch(`/api/bpexch/balance?${params}`)
}

export async function createBpexchUser(payload) {
  return apiFetch('/api/bpexch/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchBlogPosts(category) {
  const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch(`/api/blog/posts${params}`)
}

export async function fetchBlogPost(slug) {
  return apiFetch(`/api/blog/posts/${encodeURIComponent(slug)}`)
}

export async function fetchAdminBlogPosts() {
  return apiFetch('/api/blog/admin/posts')
}

export async function createBlogPost(payload) {
  return apiFetch('/api/blog/admin/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBlogPost(id, payload) {
  return apiFetch(`/api/blog/admin/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteBlogPost(id) {
  return apiFetch(`/api/blog/admin/posts/${id}`, { method: 'DELETE' })
}

export async function uploadBlogImage(imageDataUrl) {
  return apiFetch('/api/blog/admin/upload-image', {
    method: 'POST',
    body: JSON.stringify({ image: imageDataUrl }),
  })
}

export async function submitContact(payload) {
  return apiFetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchPaymentAccounts() {
  return apiFetch('/api/payment-accounts')
}

export async function fetchAdminPaymentAccounts() {
  return apiFetch('/api/admin/payment-accounts')
}

export async function updateAdminPaymentAccount(id, payload) {
  return apiFetch(`/api/admin/payment-accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function createAdminPaymentAccount(payload) {
  return apiFetch('/api/admin/payment-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminPaymentAccount(id) {
  return apiFetch(`/api/admin/payment-accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchWhatsappAgents() {
  return apiFetch('/api/whatsapp-agents')
}

export async function fetchAdminWhatsappAgents() {
  return apiFetch('/api/admin/whatsapp-agents')
}

export async function updateAdminWhatsappAgent(code, payload) {
  return apiFetch(`/api/admin/whatsapp-agents/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function createAdminWhatsappAgent(payload) {
  return apiFetch('/api/admin/whatsapp-agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminWhatsappAgent(code) {
  return apiFetch(`/api/admin/whatsapp-agents/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminExpenses(params = {}) {
  const q = new URLSearchParams()
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  const qs = q.toString()
  return apiFetch(`/api/admin/expenses${qs ? `?${qs}` : ''}`)
}

export async function createAdminExpense(payload) {
  return apiFetch('/api/admin/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminExpense(id, payload) {
  return apiFetch(`/api/admin/expenses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminExpense(id) {
  return apiFetch(`/api/admin/expenses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminProfitLoss(params = {}) {
  const q = new URLSearchParams()
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  const qs = q.toString()
  return apiFetch(`/api/admin/profit-loss${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminBpexchAgent() {
  return apiFetch('/api/admin/bpexch-agent')
}

export async function updateAdminBpexchAgent(payload) {
  return apiFetch('/api/admin/bpexch-agent', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function fetchRegisterStatus() {
  return apiFetch('/api/register/status')
}

export async function selfRegister(payload) {
  return apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Ensure username exists (and is active) in our DB before app/web login */
export async function verifyBpexchUser(payload) {
  return apiFetch('/api/bpexch/users/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function screenshotUrl(path) {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http')) return path
  return `${API_BASE}${path}`
}
