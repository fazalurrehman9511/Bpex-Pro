/**
 * Load BPEXCH proxy from project root (works when cPanel app root is the repo
 * or the server/ folder with parent repo present).
 * Fail soft — API/SPA must still boot if proxy files are missing.
 */
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolvePluginPath() {
  const candidates = [
    path.join(__dirname, '../../../vite-plugin-bpexch-proxy.js'),
    path.join(__dirname, '../../vite-plugin-bpexch-proxy.js'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

let createBpexchProxyMiddleware = null
let createStrayBpexchApiRewrite = null

const pluginPath = resolvePluginPath()
if (pluginPath) {
  try {
    const mod = await import(pathToFileURL(pluginPath).href)
    createBpexchProxyMiddleware = mod.createBpexchProxyMiddleware
    createStrayBpexchApiRewrite = mod.createStrayBpexchApiRewrite
  } catch (err) {
    console.error('[bpexch-proxy] Failed to load plugin:', err.message)
  }
} else {
  console.warn('[bpexch-proxy] vite-plugin-bpexch-proxy.js not found — /bpexch proxy disabled')
}

export { createBpexchProxyMiddleware, createStrayBpexchApiRewrite }
