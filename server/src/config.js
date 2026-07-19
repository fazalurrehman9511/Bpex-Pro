import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')

dotenv.config({ path: path.join(serverRoot, '.env') })

export const config = {
  port: Number(process.env.PORT) || 3001,
  adminUsername: process.env.ADMIN_USERNAME || 'superadmin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  databasePath: path.resolve(serverRoot, process.env.DATABASE_PATH || './data/flowexch.db'),
  uploadsDir: path.resolve(serverRoot, process.env.UPLOADS_DIR || './uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  requestTtlMs: 30 * 60 * 1000,
  bpexchSyncSecret: process.env.BPEXCH_SYNC_SECRET || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
}
