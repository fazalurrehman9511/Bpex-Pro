/**
 * Outbound HTTP to BPEXCH — optional residential proxy to bypass Cloudflare
 * on shared-hosting datacenter IPs.
 *
 * Set in server/.env (one of):
 *   BPEXCH_HTTP_PROXY=http://user:pass@host:port
 *   HTTPS_PROXY=http://user:pass@host:port
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici'

let proxyAgent = null
let proxyUrlCached = null

const PROXY_REQUIRED_MESSAGE =
  'Residential proxy is required for all BPEXCH requests. Set BPEXCH_HTTP_PROXY and make sure it is working.'
const DEFAULT_TIMEOUT_MS = Number(process.env.BPEXCH_HTTP_TIMEOUT_MS) || 20_000

function resolveProxyUrl() {
  return (
    process.env.BPEXCH_HTTP_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    ''
  ).trim()
}

export function getBpexchProxyUrl() {
  return resolveProxyUrl()
}

export function isBpexchProxyConfigured() {
  return Boolean(resolveProxyUrl())
}

export function isBpexchProxyRequired() {
  const raw = String(process.env.BPEXCH_PROXY_REQUIRED || '').trim().toLowerCase()
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

export function getBpexchProxyRequiredMessage() {
  return PROXY_REQUIRED_MESSAGE
}

export function createBpexchProxyRequiredError(message = PROXY_REQUIRED_MESSAGE) {
  const err = new Error(message)
  err.code = 'BPEXCH_PROXY_REQUIRED'
  return err
}

function getProxyAgent() {
  const url = resolveProxyUrl()
  if (!url) return undefined
  if (proxyAgent && proxyUrlCached === url) return proxyAgent
  proxyAgent = new ProxyAgent(url)
  proxyUrlCached = url
  console.log('[bpexch-http] Using outbound proxy for BPEXCH requests')
  return proxyAgent
}

function buildTimeoutSignal(signal, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return signal

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  if (!signal) return timeoutSignal
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal])
  }

  const controller = new AbortController()
  const abortFrom = (source) => {
    if (controller.signal.aborted) return
    controller.abort(source.reason)
  }

  signal.addEventListener('abort', () => abortFrom(signal), { once: true })
  timeoutSignal.addEventListener('abort', () => abortFrom(timeoutSignal), { once: true })
  return controller.signal
}

/**
 * fetch() with optional proxy dispatcher (undici).
 */
export async function bpexchHttpFetch(url, options = {}) {
  const {
    requireProxy = isBpexchProxyRequired(),
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    ...fetchOptions
  } = options
  const dispatcher = getProxyAgent()
  const finalOptions = {
    ...fetchOptions,
    signal: buildTimeoutSignal(signal, timeoutMs),
  }

  try {
    if (!dispatcher) {
      if (requireProxy) {
        throw createBpexchProxyRequiredError()
      }
      return await fetch(url, finalOptions)
    }
    return await undiciFetch(url, { ...finalOptions, dispatcher })
  } catch (err) {
    if (err?.name === 'AbortError' || err?.code === 'UND_ERR_ABORTED') {
      const timeoutErr = new Error(`BPEXCH request timed out after ${timeoutMs}ms`)
      timeoutErr.code = 'BPEXCH_HTTP_TIMEOUT'
      throw timeoutErr
    }
    throw err
  }
}
