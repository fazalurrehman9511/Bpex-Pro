/**
 * Load BPEXCH proxy from project root (works when cPanel app root is the repo
 * or the server/ folder with parent repo present).
 */
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolvePluginPath() {
  const candidates = [
    path.join(__dirname, '../../../vite-plugin-bpexch-proxy.js'), // server/src → repo root
    path.join(__dirname, '../../vite-plugin-bpexch-proxy.js'), // if nested differently
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

const pluginUrl = pathToFileURL(resolvePluginPath()).href
const mod = await import(pluginUrl)

export const createBpexchProxyMiddleware = mod.createBpexchProxyMiddleware
export const createStrayBpexchApiRewrite = mod.createStrayBpexchApiRewrite
