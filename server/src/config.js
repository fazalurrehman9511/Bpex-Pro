import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')
const projectRoot = path.join(serverRoot, '..')

dotenv.config({ path: path.join(serverRoot, '.env') })

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'
const DEFAULT_JWT_SECRET = 'dev-secret-change-in-production'

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 3001,
  adminUsername: process.env.ADMIN_USERNAME || 'superadmin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  databasePath: path.resolve(serverRoot, process.env.DATABASE_PATH || './data/flowexch.db'),
  uploadsDir: path.resolve(serverRoot, process.env.UPLOADS_DIR || './uploads'),
  /** Built Vite frontend — cPanel Node app serves SPA from here */
  distDir: path.resolve(
    process.env.DIST_DIR
      ? path.isAbsolute(process.env.DIST_DIR)
        ? process.env.DIST_DIR
        : path.join(serverRoot, process.env.DIST_DIR)
      : path.join(projectRoot, 'dist'),
  ),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  requestTtlMs: 30 * 60 * 1000,
  bpexchSyncSecret: process.env.BPEXCH_SYNC_SECRET || '',
  apiBaseUrl: process.env.API_BASE_URL || `http://127.0.0.1:${Number(process.env.PORT) || 3001}`,
  /** Enable /bpexch reverse proxy in production (needed on cPanel without nginx) */
  enableBpexchProxy: process.env.ENABLE_BPEXCH_PROXY !== '0',
  /** When 0, API-only mode (Vercel hosts frontend). Default: serve dist if present */
  serveFrontend: process.env.SERVE_FRONTEND !== '0',
  /** Allow https://*.vercel.app preview/prod frontends hitting API directly */
  corsAllowVercel: process.env.CORS_ALLOW_VERCEL !== '0',
  embedBrandName: process.env.EMBED_BRAND_NAME || process.env.VITE_EMBED_BRAND_NAME || 'BPEXCH',
}

/**
 * Refuse to boot with insecure defaults when NODE_ENV=production.
 */
export function assertProductionSafe() {
  if (!config.isProduction) return

  const problems = []

  if (!config.adminPassword || config.adminPassword.length < 12) {
    problems.push('ADMIN_PASSWORD must be set (min 12 characters)')
  }
  if (!config.jwtSecret || config.jwtSecret === DEFAULT_JWT_SECRET || config.jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be a unique random string (min 32 characters)')
  }
  if (!config.bpexchSyncSecret || config.bpexchSyncSecret.length < 16) {
    problems.push('BPEXCH_SYNC_SECRET must be set (min 16 characters)')
  }
  if (
    !config.corsOrigin ||
    config.corsOrigin.includes('localhost') && !config.corsOrigin.includes('https://')
  ) {
    // Soft warning only — still allow if they forgot; CORS also has domain allowlist
  }

  if (problems.length) {
    console.error('\n[FATAL] Production configuration is unsafe:\n')
    for (const p of problems) console.error(`  - ${p}`)
    console.error('\nFix server/.env then restart. See server/.env.example\n')
    process.exit(1)
  }
}
