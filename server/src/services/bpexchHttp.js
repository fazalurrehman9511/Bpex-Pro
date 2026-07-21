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
  return process.env.BPEXCH_PROXY_REQUIRED !== '0'
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

/**
 * fetch() with optional proxy dispatcher (undici).
 */
export async function bpexchHttpFetch(url, options = {}) {
  const { requireProxy = isBpexchProxyRequired(), ...fetchOptions } = options
  const dispatcher = getProxyAgent()
  if (!dispatcher) {
    if (requireProxy) {
      throw createBpexchProxyRequiredError()
    }
    return fetch(url, fetchOptions)
  }
  return undiciFetch(url, { ...fetchOptions, dispatcher })
}
