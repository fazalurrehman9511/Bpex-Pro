import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { config, assertProductionSafe } from './config.js'
import { expirePendingTransactions } from './db.js'
import transactionsRouter from './routes/transactions.js'
import adminRouter from './routes/admin.js'
import bpexchUsersRouter from './routes/bpexchUsers.js'
import blogRouter from './routes/blog.js'
import liveEventsRouter from './routes/liveEvents.js'
import contactRouter from './routes/contact.js'
import registerRouter from './routes/register.js'
import paymentAccountsRouter from './routes/paymentAccounts.js'
import withdrawMethodsRouter from './routes/withdrawMethods.js'
import supportContactRouter from './routes/supportContact.js'
import whatsappAgentsRouter from './routes/whatsappAgents.js'
import bpexchBalanceRouter from './routes/bpexchBalance.js'
import { startLiveEventsPoller } from './services/bpexchLive.js'
import {
  bpexchHttpFetch,
  getBpexchProxyRequiredMessage,
  isBpexchProxyConfigured,
  isBpexchProxyRequired,
} from './services/bpexchHttp.js'
import {
  createBpexchProxyMiddleware,
  createStrayBpexchApiRewrite,
} from './middleware/loadBpexchProxy.js'

assertProductionSafe()

const app = express()

// cPanel / Apache reverse proxy — real client IP for rate limits
app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: false, // BPEXCH embed + admin need flexible CSP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

const corsOrigins = String(config.corsOrigin || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function isAllowedCorsOrigin(origin) {
  if (!origin) {
    // Same-origin / server-to-server / native WebView without Origin
    return true
  }
  if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return true

  if (!config.isProduction) {
    if (
      origin.startsWith('https://localhost') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')
    ) {
      return true
    }
  }

  if (origin.startsWith('capacitor://') || origin.startsWith('https://localhost')) {
    return true
  }

  try {
    const host = new URL(origin).hostname.toLowerCase()
    if (host === 'bpexpro.com' || host.endsWith('.bpexpro.com')) return true
    if (config.corsAllowVercel && (host === 'vercel.app' || host.endsWith('.vercel.app'))) {
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '2mb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 400 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
})

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 60 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Try again later.' },
})

app.use('/api', apiLimiter)
app.use('/api/admin/login', authLimiter)
app.use('/api/bpexch/users/verify', authLimiter)
app.use('/api/register', writeLimiter)
app.use('/api/contact', writeLimiter)
app.use('/api/transactions', writeLimiter)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: config.nodeEnv,
    time: new Date().toISOString(),
  })
})

app.use('/api/transactions', transactionsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/bpexch/users', bpexchUsersRouter)
app.use('/api/bpexch/balance', bpexchBalanceRouter)
app.use('/api/blog', blogRouter)
app.use('/api/live-events', liveEventsRouter)
app.use('/api/contact', contactRouter)
app.use('/api/register', registerRouter)
app.use('/api/payment-accounts', paymentAccountsRouter)
app.use('/api/withdraw-methods', withdrawMethodsRouter)
app.use('/api/support-contact', supportContactRouter)
app.use('/api/whatsapp-agents', whatsappAgentsRouter)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
  })
})

// Uploads — no directory listing
app.use(
  '/uploads',
  express.static(config.uploadsDir, {
    index: false,
    fallthrough: false,
    maxAge: config.isProduction ? '1d' : 0,
  }),
)

// BPEXCH same-origin proxy (cPanel-friendly — no nginx sub_filter needed)
if (
  config.enableBpexchProxy &&
  typeof createBpexchProxyMiddleware === 'function' &&
  typeof createStrayBpexchApiRewrite === 'function'
) {
  app.use(createStrayBpexchApiRewrite())
  app.use(
    createBpexchProxyMiddleware({
      brandName: config.embedBrandName,
      syncSecret: config.bpexchSyncSecret,
      apiBaseUrl: config.apiBaseUrl,
      // Always use the shared BPEXCH fetcher so residential proxy rules stay consistent.
      fetchImpl: bpexchHttpFetch,
    }),
  )
  if (isBpexchProxyConfigured()) {
    console.log('BPEXCH proxy: outbound residential proxy enabled for /bpexch')
  } else if (isBpexchProxyRequired()) {
    console.warn(`[warn] ${getBpexchProxyRequiredMessage()}`)
  }
} else if (config.enableBpexchProxy) {
  console.warn('[warn] BPEXCH proxy requested but middleware unavailable')
}

// Production SPA — skip when SERVE_FRONTEND=0 (Vercel hosts UI)
const distIndex = path.join(config.distDir, 'index.html')
const hasDist = fs.existsSync(distIndex)

if (hasDist && config.serveFrontend) {
  app.use(
    express.static(config.distDir, {
      index: false,
      maxAge: config.isProduction ? '1h' : 0,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.apk')) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive')
          res.setHeader('Content-Disposition', 'attachment')
        }
      },
    }),
  )

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/bpexch')) {
      return next()
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    res.sendFile(distIndex)
  })
} else if (config.isProduction && config.serveFrontend && !hasDist) {
  console.warn(`[warn] Frontend dist not found at ${config.distDir}`)
  console.warn('[warn] Run `npm run build` in project root, then restart the Node app.')
} else if (config.isProduction && !config.serveFrontend) {
  console.log('Frontend: skipped (SERVE_FRONTEND=0 — use Vercel)')
}

// Global error handler — never leak stack traces in production
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err)
  const status = Number(err.status || err.statusCode) || 500
  res.status(status).json({
    error: config.isProduction ? 'Internal server error' : err.message || 'Internal server error',
  })
})

expirePendingTransactions()
setInterval(expirePendingTransactions, 60_000)
startLiveEventsPoller()

const onListen = () => {
  console.log(
    `BpxPro API listening on port ${config.port} (${config.nodeEnv})`,
  )
  console.log(`Database: ${config.databasePath}`)
  console.log(`Uploads: ${path.resolve(config.uploadsDir)}`)
  if (hasDist && config.serveFrontend) console.log(`Frontend: ${config.distDir}`)
  if (config.enableBpexchProxy) console.log('BPEXCH proxy: enabled at /bpexch/')
}

// Prefer PORT. BIND_HOST=0.0.0.0 on bare VPS if needed; default 127.0.0.1 behind nginx.
const bindHost = process.env.BIND_HOST || '127.0.0.1'
const server = app.listen(config.port, bindHost, onListen)

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})
