import express from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config.js'
import { expirePendingTransactions } from './db.js'
import transactionsRouter from './routes/transactions.js'
import adminRouter from './routes/admin.js'
import bpexchUsersRouter from './routes/bpexchUsers.js'
import blogRouter from './routes/blog.js'
import liveEventsRouter from './routes/liveEvents.js'
import contactRouter from './routes/contact.js'
import registerRouter from './routes/register.js'
import paymentAccountsRouter from './routes/paymentAccounts.js'
import whatsappAgentsRouter from './routes/whatsappAgents.js'
import bpexchBalanceRouter from './routes/bpexchBalance.js'
import { startLiveEventsPoller } from './services/bpexchLive.js'

const app = express()

const corsOrigins = String(config.corsOrigin || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function isAllowedCorsOrigin(origin) {
  if (!origin) return true
  if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return true
  if (
    origin.startsWith('https://localhost') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('capacitor://') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.')
  ) {
    return true
  }
  try {
    const host = new URL(origin).hostname.toLowerCase()
    if (host === 'bpexpro.com' || host.endsWith('.bpexpro.com')) return true
  } catch {
    /* ignore */
  }
  return false
}

app.use(
  cors({
    origin(origin, callback) {
      // Capacitor / Android WebView, local Vite, LAN, and bpexpro.com
      if (isAllowedCorsOrigin(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.use('/uploads', express.static(config.uploadsDir))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
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
app.use('/api/whatsapp-agents', whatsappAgentsRouter)

expirePendingTransactions()
setInterval(expirePendingTransactions, 60_000)
startLiveEventsPoller()

app.listen(config.port, '0.0.0.0', () => {
  console.log(`BpxPro API running on http://0.0.0.0:${config.port}`)
  console.log(`Database: ${config.databasePath}`)
  console.log(`Uploads: ${path.resolve(config.uploadsDir)}`)
})

