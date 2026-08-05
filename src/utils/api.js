import { Capacitor } from '@capacitor/core'
import { getBpexchUsername } from './bpexchAuth'

function isPrivateNetworkHost(hostname = '') {
  const host = String(hostname || '').toLowerCase()
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  )
}

function isPrivateNetworkUrl(url = '') {
  try {
    return isPrivateNetworkHost(new URL(url).hostname)
  } catch {
    return false
  }
}

function normalizePreferredApiBase(url = '') {
  const raw = String(url || '').trim()
  if (!raw) return ''
  try {
    const next = new URL(raw)
    if (next.hostname === 'bpexpro.com') {
      next.hostname = 'www.bpexpro.com'
    }
    return next.toString().replace(/\/$/, '')
  } catch {
    return raw.replace(/\/$/, '')
  }
}

function resolveApiBase() {
  const fromEnv = normalizePreferredApiBase(import.meta.env.VITE_API_URL || '')
  if (fromEnv) return fromEnv
  try {
    if (Capacitor.isNativePlatform()) {
      const native = normalizePreferredApiBase(import.meta.env.VITE_NATIVE_API_URL || '')
      const site = normalizePreferredApiBase(import.meta.env.VITE_SITE_URL || '')
      const preferNative = import.meta.env.VITE_NATIVE_API_PRIORITY === 'native'
      if (preferNative && native) return native
      if (site) return site
      if (native && !isPrivateNetworkUrl(native)) return native
      if (native) return native
      if (site) return site
    }
  } catch {
    /* ignore */
  }
  return ''
}

const API_BASE = resolveApiBase()
const TOKEN_KEY = 'flowexch_admin_token'

function storageGet(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  } catch {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function getAdminToken() {
  return storageGet(TOKEN_KEY)
}

export function setAdminToken(token) {
  storageSet(TOKEN_KEY, token)
}

export function clearAdminToken() {
  storageRemove(TOKEN_KEY)
}

function summarizeNonJsonBody(raw) {
  const clean = String(raw || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.slice(0, 140)
}

async function apiFetch(path, options = {}) {
  const { timeoutMs = 0, ...fetchOptions } = options
  const headers = { ...(options.headers || {}) }
  const token = getAdminToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const url = `${API_BASE}${path}`
  const controller =
    timeoutMs > 0 && !fetchOptions.signal && typeof AbortController !== 'undefined'
      ? new AbortController()
      : null
  const timeoutId =
    controller != null
      ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
      : null
  let res
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal || controller?.signal,
    })
  } catch (err) {
    const base = API_BASE || window.location.origin
    if (err?.name === 'AbortError') {
      throw new Error(`API request timed out (${base}). Please check your internet or server.`)
    }
    throw new Error(
      `API connection failed (${base}). Please restart the server / Node app.`,
    )
  } finally {
    if (timeoutId != null) {
      globalThis.clearTimeout(timeoutId)
    }
  }

  const raw = await res.text()
  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      const contentType = res.headers.get('content-type') || 'unknown'
      const bodyHint = summarizeNonJsonBody(raw)
      throw new Error(
        `API ${path} returned non-JSON (${res.status}, ${contentType}). ${bodyHint || 'Received an upstream/proxy error page.'}`,
      )
    }
  } else {
    data = {}
  }

  if (!res.ok) {
    if (res.status === 401 && path.startsWith('/api/admin') && !path.includes('/login')) {
      clearAdminToken()
    }
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

function asArray(data, label = 'data') {
  if (Array.isArray(data)) return data
  throw new Error(`Expected array for ${label}`)
}


export async function createTransaction(payload) {
  return apiFetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchUserTransactions({ phone, username } = {}, options = {}) {
  const params = new URLSearchParams()
  if (username?.trim()) params.set('name', username.trim())
  if (![...params.keys()].length) {
    throw new Error('Username is required')
  }
  return apiFetch(`/api/transactions?${params}`, options)
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
  return asArray(await apiFetch(`/api/admin/transactions${qs ? `?${qs}` : ''}`), 'transactions')
}

export async function updateAdminTransaction(id, status, adminNotes = '') {
  return apiFetch(`/api/admin/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNotes }),
  })
}

export async function fetchBpexchUsers() {
  return asArray(await apiFetch('/api/bpexch/users'), 'bpexch users')
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

export async function fetchBpexchBalance(username, options = {}) {
  const params = new URLSearchParams({ username: String(username || '').trim() })
  return apiFetch(`/api/bpexch/balance?${params}`, options)
}

export async function createBpexchUser(payload) {
  return apiFetch('/api/bpexch/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchBlogCategories() {
  return asArray(await apiFetch('/api/blog/categories'), 'blog categories')
}

export async function fetchAdminBlogCategories() {
  return asArray(await apiFetch('/api/blog/admin/categories'), 'blog categories')
}

export async function createBlogCategory(payload) {
  return apiFetch('/api/blog/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBlogCategory(id, payload) {
  return apiFetch(`/api/blog/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteBlogCategory(id) {
  return apiFetch(`/api/blog/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function fetchBlogPosts(category) {
  const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch(`/api/blog/posts${params}`)
}

export async function fetchBlogPost(slug) {
  return apiFetch(`/api/blog/posts/${encodeURIComponent(slug)}`)
}

export async function fetchAdminBlogPosts() {
  return asArray(await apiFetch('/api/blog/admin/posts'), 'blog posts')
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

export async function fetchAdminContactMessages() {
  return asArray(await apiFetch('/api/admin/contact-messages'), 'contact messages')
}

export async function deleteAdminContactMessage(id) {
  return apiFetch(`/api/admin/contact-messages/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function fetchPaymentAccounts() {
  return asArray(await apiFetch('/api/payment-accounts'), 'payment accounts')
}

export async function fetchWithdrawMethods() {
  return asArray(await apiFetch('/api/withdraw-methods'), 'withdraw methods')
}

export async function fetchSupportContact() {
  return apiFetch('/api/support-contact')
}

export async function fetchHomepageContent() {
  return apiFetch('/api/homepage-content')
}

export async function fetchAdminHomepageContent() {
  return apiFetch('/api/admin/homepage-content')
}

export async function updateAdminHomepageContent(content) {
  return apiFetch('/api/admin/homepage-content', {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export async function fetchBrandGuideContent() {
  return apiFetch('/api/brand-guide-content')
}

export async function fetchAdminBrandGuideContent() {
  return apiFetch('/api/admin/brand-guide-content')
}

export async function updateAdminBrandGuideContent(content) {
  return apiFetch('/api/admin/brand-guide-content', {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export async function fetchResponsibleGamingContent() {
  return apiFetch('/api/responsible-gaming-content')
}

export async function fetchAdminResponsibleGamingContent() {
  return apiFetch('/api/admin/responsible-gaming-content')
}

export async function updateAdminResponsibleGamingContent(content) {
  return apiFetch('/api/admin/responsible-gaming-content', {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export async function fetchAdminPaymentAccounts() {
  return asArray(await apiFetch('/api/admin/payment-accounts'), 'payment accounts')
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

export async function fetchAdminWithdrawMethods() {
  return asArray(await apiFetch('/api/admin/withdraw-methods'), 'withdraw methods')
}

export async function updateAdminWithdrawMethod(id, payload) {
  return apiFetch(`/api/admin/withdraw-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function createAdminWithdrawMethod(payload) {
  return apiFetch('/api/admin/withdraw-methods', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminWithdrawMethod(id) {
  return apiFetch(`/api/admin/withdraw-methods/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchWhatsappAgents() {
  return apiFetch('/api/whatsapp-agents')
}

export async function fetchAdminWhatsappAgents() {
  return asArray(await apiFetch('/api/admin/whatsapp-agents'), 'whatsapp agents')
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
  return asArray(await apiFetch(`/api/admin/expenses${qs ? `?${qs}` : ''}`), 'expenses')
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

export async function fetchAdminSupportContact() {
  return apiFetch('/api/admin/support-contact')
}

export async function updateAdminSupportContact(payload) {
  return apiFetch('/api/admin/support-contact', {
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
export async function verifyBpexchUser(payload, options = {}) {
  return apiFetch('/api/bpexch/users/verify', {
    ...options,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function screenshotUrl(path) {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http')) return path
  return `${API_BASE}${path}`
}
