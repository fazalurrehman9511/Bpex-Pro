import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { config } from './config.js'
import { DEFAULT_HOMEPAGE_CONTENT, normalizeHomepageContent } from './homepageContent.js'
import {
  DEFAULT_BRAND_GUIDE_CONTENT,
  normalizeBrandGuideContent,
  normalizeBrandGuideSlug,
} from './brandGuideContent.js'
import {
  DEFAULT_RESPONSIBLE_GAMING_CONTENT,
  normalizeResponsibleGamingContent,
} from './responsibleGamingContent.js'
import { normalizeUserType } from './utils/bpexchUser.js'

const dataDir = path.dirname(config.databasePath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(config.databasePath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'expired')),
    amount REAL NOT NULL,
    payment_method_id TEXT NOT NULL,
    payment_method_label TEXT NOT NULL,
    account_title TEXT DEFAULT '',
    account_number TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    screenshot_path TEXT,
    payout_account_title TEXT DEFAULT '',
    payout_account_number TEXT DEFAULT '',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    available_balance TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    reviewed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
`)

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS bpexch_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT '',
    user_type TEXT NOT NULL DEFAULT 'Bettor',
    is_active INTEGER NOT NULL DEFAULT 1,
    phone TEXT DEFAULT '',
    reference TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    parent_id TEXT DEFAULT '',
    source TEXT NOT NULL DEFAULT 'bpexch',
    bpexch_id TEXT DEFAULT '',
    balance REAL,
    credit REAL,
    max_withdraw REAL,
    balance_updated_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_bpexch_users_username ON bpexch_users(username);
  CREATE INDEX IF NOT EXISTS idx_bpexch_users_created_at ON bpexch_users(created_at DESC);

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'guides',
    category_label TEXT NOT NULL DEFAULT 'Guides',
    author TEXT NOT NULL DEFAULT 'FlowExch Team',
    published_at TEXT NOT NULL,
    read_time TEXT NOT NULL DEFAULT '3 min read',
    featured INTEGER NOT NULL DEFAULT 0,
    gradient TEXT NOT NULL DEFAULT 'from-green-600/40 to-navy-light',
    emoji TEXT NOT NULL DEFAULT '📝',
    content TEXT NOT NULL DEFAULT '[]',
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    meta_keywords TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
  CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

  CREATE TABLE IF NOT EXISTS blog_categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_blog_categories_sort ON blog_categories(sort_order ASC, label ASC);

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    subject TEXT DEFAULT '',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

  CREATE TABLE IF NOT EXISTS payment_accounts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    account_title TEXT NOT NULL DEFAULT '',
    account_number TEXT NOT NULL DEFAULT '',
    bank_name TEXT NOT NULL DEFAULT '',
    qr_code_image TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS withdraw_methods (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_agents (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flag TEXT NOT NULL DEFAULT '',
    dial_code TEXT NOT NULL DEFAULT '',
    phone_placeholder TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
`)

ensureColumn('bpexch_users', 'bpexch_id', "TEXT DEFAULT ''")
ensureColumn('bpexch_users', 'balance', 'REAL')
ensureColumn('bpexch_users', 'credit', 'REAL')
ensureColumn('bpexch_users', 'max_withdraw', 'REAL')
ensureColumn('bpexch_users', 'balance_updated_at', 'TEXT')
ensureColumn('bpexch_users', 'agent_username', "TEXT DEFAULT ''")
ensureColumn('payment_accounts', 'qr_code_image', "TEXT NOT NULL DEFAULT ''")
ensureColumn('blog_posts', 'meta_title', "TEXT NOT NULL DEFAULT ''")
ensureColumn('blog_posts', 'meta_description', "TEXT NOT NULL DEFAULT ''")
ensureColumn('blog_posts', 'meta_keywords', "TEXT NOT NULL DEFAULT ''")
ensureColumn('blog_posts', 'cover_image', "TEXT NOT NULL DEFAULT ''")

db.exec(`
  CREATE TABLE IF NOT EXISTS bpexch_agent_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS support_contact_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    whatsapp TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS homepage_content_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS brand_guide_content_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS responsible_gaming_content_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );
`)

;(() => {
  const row = db.prepare('SELECT id FROM bpexch_agent_config WHERE id = 1').get()
  if (!row) {
    const u = String(process.env.BPEXCH_AGENT_USERNAME || process.env.BPEXCH_LIVE_USERNAME || '').trim()
    const p = String(process.env.BPEXCH_AGENT_PASSWORD || process.env.BPEXCH_LIVE_PASSWORD || '').trim()
    db.prepare(`
      INSERT INTO bpexch_agent_config (id, username, password, label, updated_at)
      VALUES (1, ?, ?, ?, ?)
    `).run(u, p, u ? 'Active BPEXCH Agent' : '', new Date().toISOString())
  }

  /* One-time: tag existing users to current agent so list filter works after upgrade */
  const agentUser =
    String(db.prepare('SELECT username FROM bpexch_agent_config WHERE id = 1').get()?.username || '').trim() ||
    String(process.env.BPEXCH_AGENT_USERNAME || process.env.BPEXCH_LIVE_USERNAME || '').trim()
  if (agentUser) {
    const stats = db
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN IFNULL(agent_username, '') = '' THEN 1 ELSE 0 END) AS empty
         FROM bpexch_users`,
      )
      .get()
    if (Number(stats?.total) > 0 && Number(stats?.empty) === Number(stats?.total)) {
      db.prepare('UPDATE bpexch_users SET agent_username = ?').run(agentUser)
    }
  }

  const supportRow = db.prepare('SELECT id FROM support_contact_config WHERE id = 1').get()
  if (!supportRow) {
    const supportWhatsApp = String(
      process.env.SUPPORT_WHATSAPP ||
        process.env.WHATSAPP_SUPPORT ||
        process.env.VITE_WHATSAPP_SUPPORT ||
        '',
    )
      .replace(/[^\d]/g, '')
      .trim()
    db.prepare(`
      INSERT INTO support_contact_config (id, whatsapp, updated_at)
      VALUES (1, ?, ?)
    `).run(supportWhatsApp, new Date().toISOString())
  }

  const homepageRow = db.prepare('SELECT id FROM homepage_content_config WHERE id = 1').get()
  if (!homepageRow) {
    db.prepare(`
      INSERT INTO homepage_content_config (id, content, updated_at)
      VALUES (1, ?, ?)
    `).run(JSON.stringify(DEFAULT_HOMEPAGE_CONTENT), new Date().toISOString())
  }

  const brandGuideRow = db.prepare('SELECT id FROM brand_guide_content_config WHERE id = 1').get()
  if (!brandGuideRow) {
    db.prepare(`
      INSERT INTO brand_guide_content_config (id, content, updated_at)
      VALUES (1, ?, ?)
    `).run(JSON.stringify(DEFAULT_BRAND_GUIDE_CONTENT), new Date().toISOString())
  }

  const responsibleGamingRow = db.prepare('SELECT id FROM responsible_gaming_content_config WHERE id = 1').get()
  if (!responsibleGamingRow) {
    db.prepare(`
      INSERT INTO responsible_gaming_content_config (id, content, updated_at)
      VALUES (1, ?, ?)
    `).run(JSON.stringify(DEFAULT_RESPONSIBLE_GAMING_CONTENT), new Date().toISOString())
  }
})()

const defaultPaymentAccounts = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    account_title: 'FlowExch Agent',
    account_number: '03001234567',
    bank_name: 'JazzCash',
  },
  {
    id: 'easypaisa',
    label: 'EasyPaisa',
    account_title: 'FlowExch Agent',
    account_number: '03451234567',
    bank_name: 'EasyPaisa',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    account_title: 'FlowExch (Pvt) Ltd',
    account_number: '12345678901234',
    bank_name: 'HBL — Main Branch',
  },
]

const insertPaymentAccount = db.prepare(`
  INSERT OR IGNORE INTO payment_accounts (id, label, account_title, account_number, bank_name, updated_at)
  VALUES (@id, @label, @account_title, @account_number, @bank_name, @updated_at)
`)

const seedNow = new Date().toISOString()
for (const row of defaultPaymentAccounts) {
  insertPaymentAccount.run({ ...row, updated_at: seedNow })
}

const defaultWithdrawMethods = [
  { id: 'easypaisa', label: 'EasyPaisa' },
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'bank', label: 'Bank Transfer' },
]

const insertWithdrawMethod = db.prepare(`
  INSERT OR IGNORE INTO withdraw_methods (id, label, updated_at)
  VALUES (@id, @label, @updated_at)
`)

for (const row of defaultWithdrawMethods) {
  insertWithdrawMethod.run({ ...row, updated_at: seedNow })
}

export function rowToPaymentAccount(row) {
  if (!row) return null
  return {
    id: row.id,
    label: row.label,
    accountTitle: row.account_title || '',
    accountNumber: row.account_number || '',
    bankName: row.bank_name || '',
    qrCodeImage: row.qr_code_image || '',
    updatedAt: row.updated_at || null,
  }
}

export function listPaymentAccounts() {
  return db
    .prepare('SELECT * FROM payment_accounts ORDER BY id ASC')
    .all()
    .map(rowToPaymentAccount)
}

export function getPaymentAccountRow(id) {
  return rowToPaymentAccount(
    db.prepare('SELECT * FROM payment_accounts WHERE id = ?').get(id),
  )
}

export function updatePaymentAccount(id, patch) {
  const existing = db.prepare('SELECT * FROM payment_accounts WHERE id = ?').get(id)
  if (!existing) return null
  const updatedAt = new Date().toISOString()
  db.prepare(`
    UPDATE payment_accounts
    SET account_title = ?, account_number = ?, bank_name = ?, label = ?, qr_code_image = ?, updated_at = ?
    WHERE id = ?
  `).run(
    patch.accountTitle ?? existing.account_title,
    patch.accountNumber ?? existing.account_number,
    patch.bankName ?? existing.bank_name,
    patch.label ?? existing.label,
    patch.qrCodeImage ?? existing.qr_code_image ?? '',
    updatedAt,
    id,
  )
  return getPaymentAccountRow(id)
}

export function createPaymentAccount(payload) {
  let id = String(payload.id || payload.label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!id) throw new Error('Payment method id is required')
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(id)) {
    throw new Error('Id must be lowercase letters / numbers / dashes (e.g. nayapay)')
  }
  if (getPaymentAccountRow(id)) {
    throw new Error('Payment method already exists')
  }
  const label = String(payload.label || '').trim()
  if (!label) throw new Error('Label is required')
  const accountTitle = String(payload.accountTitle || '').trim()
  const accountNumber = String(payload.accountNumber || '').trim()
  if (!accountTitle || !accountNumber) {
    throw new Error('Account title and number are required')
  }
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO payment_accounts (id, label, account_title, account_number, bank_name, qr_code_image, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    label,
    accountTitle,
    accountNumber,
    String(payload.bankName || '').trim(),
    String(payload.qrCodeImage || '').trim(),
    updatedAt,
  )
  return getPaymentAccountRow(id)
}

export function deletePaymentAccount(id) {
  const existing = getPaymentAccountRow(id)
  if (!existing) return null
  db.prepare('DELETE FROM payment_accounts WHERE id = ?').run(id)
  return existing
}

export function rowToWithdrawMethod(row) {
  if (!row) return null
  return {
    id: row.id,
    label: row.label,
    updatedAt: row.updated_at || null,
  }
}

export function listWithdrawMethods() {
  return db
    .prepare('SELECT rowid, * FROM withdraw_methods ORDER BY rowid ASC')
    .all()
    .map(rowToWithdrawMethod)
}

export function getWithdrawMethodRow(id) {
  return rowToWithdrawMethod(
    db.prepare('SELECT * FROM withdraw_methods WHERE id = ?').get(id),
  )
}

export function updateWithdrawMethod(id, patch) {
  const existing = db.prepare('SELECT * FROM withdraw_methods WHERE id = ?').get(id)
  if (!existing) return null
  const updatedAt = new Date().toISOString()
  db.prepare(`
    UPDATE withdraw_methods
    SET label = ?, updated_at = ?
    WHERE id = ?
  `).run(
    patch.label ?? existing.label,
    updatedAt,
    id,
  )
  return getWithdrawMethodRow(id)
}

export function createWithdrawMethod(payload) {
  let id = String(payload.id || payload.label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!id) throw new Error('Withdraw method id is required')
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(id)) {
    throw new Error('Id must be lowercase letters / numbers / dashes (e.g. nayapay)')
  }
  if (getWithdrawMethodRow(id)) {
    throw new Error('Withdraw method already exists')
  }
  const label = String(payload.label || '').trim()
  if (!label) throw new Error('Label is required')
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO withdraw_methods (id, label, updated_at)
    VALUES (?, ?, ?)
  `).run(id, label, updatedAt)
  return getWithdrawMethodRow(id)
}

export function deleteWithdrawMethod(id) {
  const existing = getWithdrawMethodRow(id)
  if (!existing) return null
  db.prepare('DELETE FROM withdraw_methods WHERE id = ?').run(id)
  return existing
}

const defaultWhatsappAgents = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dial_code: '+92',
    phone_placeholder: '300 1234567',
    whatsapp: '923001234567',
    sort_order: 1,
  },
  {
    code: 'AE',
    name: 'UAE',
    flag: '🇦🇪',
    dial_code: '+971',
    phone_placeholder: '50 123 4567',
    whatsapp: '971501234567',
    sort_order: 2,
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dial_code: '+966',
    phone_placeholder: '50 123 4567',
    whatsapp: '966501234567',
    sort_order: 3,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dial_code: '+44',
    phone_placeholder: '7700 900123',
    whatsapp: '447700900123',
    sort_order: 4,
  },
]

const insertWhatsappAgent = db.prepare(`
  INSERT OR IGNORE INTO whatsapp_agents (
    code, name, flag, dial_code, phone_placeholder, whatsapp, is_active, sort_order, updated_at
  ) VALUES (
    @code, @name, @flag, @dial_code, @phone_placeholder, @whatsapp, 1, @sort_order, @updated_at
  )
`)

for (const row of defaultWhatsappAgents) {
  insertWhatsappAgent.run({ ...row, updated_at: seedNow })
}

export function rowToWhatsappAgent(row) {
  if (!row) return null
  return {
    code: row.code,
    name: row.name,
    flag: row.flag || '',
    dialCode: row.dial_code || '',
    phonePlaceholder: row.phone_placeholder || '',
    whatsapp: row.whatsapp || '',
    isActive: Number(row.is_active) !== 0,
    sortOrder: Number(row.sort_order) || 0,
    updatedAt: row.updated_at || null,
  }
}

export function listWhatsappAgents({ activeOnly = false } = {}) {
  const rows = activeOnly
    ? db
        .prepare(
          'SELECT * FROM whatsapp_agents WHERE is_active = 1 ORDER BY sort_order ASC, name ASC',
        )
        .all()
    : db.prepare('SELECT * FROM whatsapp_agents ORDER BY sort_order ASC, name ASC').all()
  return rows.map(rowToWhatsappAgent)
}

export function getWhatsappAgent(code) {
  return rowToWhatsappAgent(
    db.prepare('SELECT * FROM whatsapp_agents WHERE code = ?').get(code),
  )
}

export function updateWhatsappAgent(code, patch) {
  const existing = db.prepare('SELECT * FROM whatsapp_agents WHERE code = ?').get(code)
  if (!existing) return null
  const updatedAt = new Date().toISOString()
  db.prepare(`
    UPDATE whatsapp_agents
    SET name = ?, flag = ?, dial_code = ?, phone_placeholder = ?, whatsapp = ?,
        is_active = ?, sort_order = ?, updated_at = ?
    WHERE code = ?
  `).run(
    patch.name ?? existing.name,
    patch.flag ?? existing.flag,
    patch.dialCode ?? existing.dial_code,
    patch.phonePlaceholder ?? existing.phone_placeholder,
    patch.whatsapp ?? existing.whatsapp,
    patch.isActive === undefined
      ? existing.is_active
      : patch.isActive === false || patch.isActive === 0
        ? 0
        : 1,
    patch.sortOrder ?? existing.sort_order,
    updatedAt,
    code,
  )
  return getWhatsappAgent(code)
}

export function createWhatsappAgent(payload) {
  const code = String(payload.code || '')
    .trim()
    .toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) {
    throw new Error('Country code must be 2 letters (e.g. US, PK)')
  }
  if (getWhatsappAgent(code)) {
    throw new Error('Country already exists')
  }
  const name = String(payload.name || '').trim()
  if (!name) throw new Error('Country name is required')
  const whatsapp = String(payload.whatsapp || '').replace(/[^\d]/g, '')
  if (whatsapp.length < 8) throw new Error('Enter a valid WhatsApp number')

  const maxOrder =
    db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM whatsapp_agents').get()?.m || 0
  const updatedAt = new Date().toISOString()

  db.prepare(`
    INSERT INTO whatsapp_agents (
      code, name, flag, dial_code, phone_placeholder, whatsapp, is_active, sort_order, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    name,
    String(payload.flag || '').trim(),
    String(payload.dialCode || '').trim(),
    String(payload.phonePlaceholder || '').trim(),
    whatsapp,
    payload.isActive === false || payload.isActive === 0 ? 0 : 1,
    Number(payload.sortOrder) || maxOrder + 1,
    updatedAt,
  )
  return getWhatsappAgent(code)
}

export function deleteWhatsappAgent(code) {
  const existing = getWhatsappAgent(code)
  if (!existing) return null
  db.prepare('DELETE FROM whatsapp_agents WHERE code = ?').run(code)
  return existing
}

function newExpenseId() {
  return `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function rowToExpense(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'general',
    amount: Number(row.amount) || 0,
    expenseDate: row.expense_date,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listExpenses({ dateFrom, dateTo } = {}) {
  let sql = 'SELECT * FROM expenses WHERE 1=1'
  const params = []
  if (dateFrom) {
    sql += ' AND expense_date >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND expense_date <= ?'
    params.push(dateTo)
  }
  sql += ' ORDER BY expense_date DESC, created_at DESC'
  return db.prepare(sql).all(...params).map(rowToExpense)
}

export function getExpense(id) {
  return rowToExpense(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id))
}

export function createExpense(payload) {
  const title = String(payload.title || '').trim()
  if (!title) throw new Error('Title is required')
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid amount')
  const expenseDate = String(payload.expenseDate || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) throw new Error('Expense date is required')
  const now = new Date().toISOString()
  const id = newExpenseId()
  db.prepare(`
    INSERT INTO expenses (id, title, category, amount, expense_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    String(payload.category || 'general').trim() || 'general',
    amount,
    expenseDate,
    String(payload.notes || '').trim(),
    now,
    now,
  )
  return getExpense(id)
}

export function updateExpense(id, patch) {
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id)
  if (!existing) return null
  const title = patch.title != null ? String(patch.title).trim() : existing.title
  if (!title) throw new Error('Title is required')
  const amount =
    patch.amount != null ? Number(patch.amount) : Number(existing.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid amount')
  const expenseDate =
    patch.expenseDate != null
      ? String(patch.expenseDate).slice(0, 10)
      : existing.expense_date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) throw new Error('Expense date is required')
  const updatedAt = new Date().toISOString()
  db.prepare(`
    UPDATE expenses
    SET title = ?, category = ?, amount = ?, expense_date = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title,
    patch.category != null
      ? String(patch.category).trim() || 'general'
      : existing.category,
    amount,
    expenseDate,
    patch.notes != null ? String(patch.notes).trim() : existing.notes,
    updatedAt,
    id,
  )
  return getExpense(id)
}

export function deleteExpense(id) {
  const existing = getExpense(id)
  if (!existing) return null
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return existing
}

/** Approved deposits/withdraws + expenses for P&L dashboard. */
export function getProfitLossSummary({ dateFrom, dateTo } = {}) {
  let txSql = `SELECT type, SUM(amount) AS total, COUNT(*) AS count
    FROM transactions WHERE status = 'approved'`
  const txParams = []
  if (dateFrom) {
    txSql += ' AND date(created_at) >= date(?)'
    txParams.push(dateFrom)
  }
  if (dateTo) {
    txSql += ' AND date(created_at) <= date(?)'
    txParams.push(dateTo)
  }
  txSql += ' GROUP BY type'
  const txRows = db.prepare(txSql).all(...txParams)

  let deposits = 0
  let withdraws = 0
  let depositCount = 0
  let withdrawCount = 0
  for (const row of txRows) {
    if (row.type === 'deposit') {
      deposits = Number(row.total) || 0
      depositCount = Number(row.count) || 0
    }
    if (row.type === 'withdraw') {
      withdraws = Number(row.total) || 0
      withdrawCount = Number(row.count) || 0
    }
  }

  let expSql = 'SELECT SUM(amount) AS total, COUNT(*) AS count FROM expenses WHERE 1=1'
  const expParams = []
  if (dateFrom) {
    expSql += ' AND expense_date >= ?'
    expParams.push(dateFrom)
  }
  if (dateTo) {
    expSql += ' AND expense_date <= ?'
    expParams.push(dateTo)
  }
  const expRow = db.prepare(expSql).get(...expParams)
  const expenses = Number(expRow?.total) || 0
  const expenseCount = Number(expRow?.count) || 0

  const cashflow = deposits - withdraws
  const netProfit = cashflow - expenses

  const byCategory = db
    .prepare(
      `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses WHERE 1=1
       ${dateFrom ? ' AND expense_date >= ?' : ''}
       ${dateTo ? ' AND expense_date <= ?' : ''}
       GROUP BY category ORDER BY total DESC`,
    )
    .all(...expParams)
    .map((r) => ({
      category: r.category || 'general',
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
    }))

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    deposits,
    depositCount,
    withdraws,
    withdrawCount,
    expenses,
    expenseCount,
    cashflow,
    netProfit,
    byCategory,
  }
}

export function expirePendingTransactions() {
  db.prepare(`
    UPDATE transactions
    SET status = 'pending'
    WHERE status = 'expired'
  `).run()
}

export function rowToTransaction(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    status: row.status === 'expired' ? 'pending' : row.status,
    amount: row.amount,
    paymentMethodId: row.payment_method_id,
    paymentMethodLabel: row.payment_method_label,
    accountTitle: row.account_title || '',
    accountNumber: row.account_number || '',
    bankName: row.bank_name || '',
    screenshot: row.screenshot_path ? `/uploads/${row.screenshot_path}` : null,
    payoutAccountTitle: row.payout_account_title || '',
    payoutAccountNumber: row.payout_account_number || '',
    name: row.name,
    phone: row.phone,
    availableBalance: row.available_balance,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    reviewedAt: row.reviewed_at,
  }
}

/**
 * @param {object} row
 * @param {{ includePassword?: boolean }} [opts] — only admin / self-register receipt should set true
 */
export function rowToBpexchUser(row, opts = {}) {
  if (!row) return null
  const includePassword = Boolean(opts.includePassword)
  return {
    id: row.id,
    username: row.username,
    ...(includePassword ? { password: row.password } : {}),
    userType: normalizeUserType(row.user_type),
    isActive: Boolean(row.is_active),
    phone: row.phone || '',
    reference: row.reference || '',
    notes: row.notes || '',
    parentId: row.parent_id || '',
    source: row.source,
    bpexchId: row.bpexch_id || '',
    agentUsername: row.agent_username || '',
    balance: row.balance == null ? null : Number(row.balance),
    credit: row.credit == null ? null : Number(row.credit),
    maxWithdraw: row.max_withdraw == null ? null : Number(row.max_withdraw),
    balanceUpdatedAt: row.balance_updated_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function updateBpexchUserBalance(username, { userId, credit, balance, maxWithdraw }) {
  const name = String(username || '').trim()
  if (!name) return null
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE bpexch_users SET
      bpexch_id = COALESCE(?, bpexch_id),
      credit = ?,
      balance = ?,
      max_withdraw = ?,
      balance_updated_at = ?,
      updated_at = ?
    WHERE username = ?
  `).run(
    userId ? String(userId) : null,
    credit ?? null,
    balance ?? null,
    maxWithdraw ?? null,
    now,
    now,
    name,
  )
  return db.prepare('SELECT * FROM bpexch_users WHERE username = ?').get(name)
}

/** Case-insensitive lookup for login gating */
export function findBpexchUserByUsername(username) {
  const name = String(username || '').trim()
  if (!name) return null
  return db
    .prepare('SELECT * FROM bpexch_users WHERE lower(username) = lower(?) LIMIT 1')
    .get(name)
}

/** Active BPEXCH Master/Admin credentials (DB overrides .env). */
export function getBpexchAgentConfig() {
  const row = db.prepare('SELECT * FROM bpexch_agent_config WHERE id = 1').get()
  const envUser = String(
    process.env.BPEXCH_AGENT_USERNAME || process.env.BPEXCH_LIVE_USERNAME || '',
  ).trim()
  const envPass = String(
    process.env.BPEXCH_AGENT_PASSWORD || process.env.BPEXCH_LIVE_PASSWORD || '',
  ).trim()
  const username = String(row?.username || '').trim() || envUser
  const password = String(row?.password || '').trim() || envPass
  return {
    username,
    password,
    label: String(row?.label || '').trim() || (username ? 'Active BPEXCH Agent' : ''),
    updatedAt: row?.updated_at || null,
    source: String(row?.username || '').trim() ? 'db' : envUser ? 'env' : 'none',
    configured: Boolean(username && password),
  }
}

export function updateBpexchAgentConfig(patch = {}) {
  const existing = getBpexchAgentConfig()
  const username =
    patch.username != null ? String(patch.username).trim() : existing.username
  const password =
    patch.password != null && String(patch.password).trim() !== ''
      ? String(patch.password).trim()
      : existing.password
  const label =
    patch.label != null ? String(patch.label).trim() : existing.label || username
  if (!username) throw new Error('BPEXCH agent username is required')
  if (!password) throw new Error('BPEXCH agent password is required')
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO bpexch_agent_config (id, username, password, label, updated_at)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      password = excluded.password,
      label = excluded.label,
      updated_at = excluded.updated_at
  `).run(username, password, label || username, updatedAt)
  return getBpexchAgentConfig()
}

export function getSupportContactConfig() {
  const row = db.prepare('SELECT * FROM support_contact_config WHERE id = 1').get()
  const envWhatsApp = String(
    process.env.SUPPORT_WHATSAPP ||
      process.env.WHATSAPP_SUPPORT ||
      process.env.VITE_WHATSAPP_SUPPORT ||
      '',
  )
    .replace(/[^\d]/g, '')
    .trim()
  const whatsapp = String(row?.whatsapp || '').trim() || envWhatsApp
  return {
    whatsapp,
    updatedAt: row?.updated_at || null,
    source: String(row?.whatsapp || '').trim() ? 'db' : envWhatsApp ? 'env' : 'none',
    configured: Boolean(whatsapp),
  }
}

export function updateSupportContactConfig(patch = {}) {
  const existing = getSupportContactConfig()
  const whatsapp =
    patch.whatsapp != null
      ? String(patch.whatsapp).replace(/[^\d]/g, '').trim()
      : existing.whatsapp
  if (!whatsapp || whatsapp.length < 8) {
    throw new Error('Support WhatsApp number is required')
  }
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO support_contact_config (id, whatsapp, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      whatsapp = excluded.whatsapp,
      updated_at = excluded.updated_at
  `).run(whatsapp, updatedAt)
  return getSupportContactConfig()
}

export function getHomepageContentConfig() {
  const row = db.prepare('SELECT * FROM homepage_content_config WHERE id = 1').get()
  let parsed = DEFAULT_HOMEPAGE_CONTENT
  if (row?.content) {
    try {
      parsed = JSON.parse(row.content)
    } catch {
      parsed = DEFAULT_HOMEPAGE_CONTENT
    }
  }
  return {
    content: normalizeHomepageContent(parsed),
    updatedAt: row?.updated_at || null,
    source: row?.content ? 'db' : 'default',
  }
}

export function updateHomepageContentConfig(patch = {}) {
  const next = normalizeHomepageContent(patch?.content ?? patch)
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO homepage_content_config (id, content, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(next), updatedAt)
  return getHomepageContentConfig()
}

export function getBrandGuideContentConfig() {
  const row = db.prepare('SELECT * FROM brand_guide_content_config WHERE id = 1').get()
  let parsed = DEFAULT_BRAND_GUIDE_CONTENT
  if (row?.content) {
    try {
      parsed = JSON.parse(row.content)
    } catch {
      parsed = DEFAULT_BRAND_GUIDE_CONTENT
    }
  }
  return {
    content: normalizeBrandGuideContent(parsed),
    updatedAt: row?.updated_at || null,
    source: row?.content ? 'db' : 'default',
  }
}

export function updateBrandGuideContentConfig(patch = {}) {
  const current = getBrandGuideContentConfig()
  const incoming = normalizeBrandGuideContent(patch?.content ?? patch)
  const oldSlug = normalizeBrandGuideSlug(current.content?.slug)
  const newSlug = normalizeBrandGuideSlug(incoming.slug)

  if (oldSlug !== newSlug && oldSlug) {
    const redirects = new Set(
      [...(current.content?.redirectSlugs || []), ...(incoming.redirectSlugs || [])]
        .map((item) => normalizeBrandGuideSlug(item, ''))
        .filter(Boolean),
    )
    redirects.add(oldSlug)
    redirects.delete(newSlug)
    incoming.redirectSlugs = [...redirects]
  }

  const next = normalizeBrandGuideContent(incoming)
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO brand_guide_content_config (id, content, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(next), updatedAt)
  return getBrandGuideContentConfig()
}

export function getResponsibleGamingContentConfig() {
  const row = db.prepare('SELECT * FROM responsible_gaming_content_config WHERE id = 1').get()
  let parsed = DEFAULT_RESPONSIBLE_GAMING_CONTENT
  if (row?.content) {
    try {
      parsed = JSON.parse(row.content)
    } catch {
      parsed = DEFAULT_RESPONSIBLE_GAMING_CONTENT
    }
  }
  return {
    content: normalizeResponsibleGamingContent(parsed),
    updatedAt: row?.updated_at || null,
    source: row?.content ? 'db' : 'default',
  }
}

export function updateResponsibleGamingContentConfig(patch = {}) {
  const next = normalizeResponsibleGamingContent(patch?.content ?? patch)
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO responsible_gaming_content_config (id, content, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(next), updatedAt)
  return getResponsibleGamingContentConfig()
}

/**
 * Verify user may log in via app/web.
 * Returns { ok, user?, error?, code? }
 */
export function verifyBpexchUserForLogin({ username, password } = {}) {
  const name = String(username || '').trim()
  if (!name) {
    return { ok: false, code: 'missing_username', error: 'Username is required' }
  }
  const row = findBpexchUserByUsername(name)
  if (!row) {
    return {
      ok: false,
      code: 'not_found',
      error: "User doesn't exist in our database. Please register first or contact support.",
    }
  }
  if (Number(row.is_active) === 0) {
    return {
      ok: false,
      code: 'inactive',
      error: 'This account is disabled. Please contact support or your agent.',
    }
  }
  const storedPass = String(row.password || '')
  const givenPass = password == null ? null : String(password)
  if (givenPass != null && storedPass && storedPass !== givenPass) {
    return {
      ok: false,
      code: 'bad_password',
      error: 'Incorrect username or password.',
    }
  }
  return {
    ok: true,
    user: {
      username: row.username,
      isActive: true,
      userType: row.user_type,
    },
  }
}

export function rowToContactMessage(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    subject: row.subject || '',
    message: row.message,
    createdAt: row.created_at,
  }
}

export function listContactMessages({ limit = 200 } = {}) {
  const capped = Math.min(Math.max(1, Number(limit) || 200), 500)
  const rows = db.prepare(`
    SELECT * FROM contact_messages
    ORDER BY created_at DESC
    LIMIT ?
  `).all(capped)
  return rows.map(rowToContactMessage)
}

export function deleteContactMessage(id) {
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id)
  if (!result.changes) return { error: 'Message not found' }
  return { ok: true }
}

const DEFAULT_BLOG_CATEGORIES = [
  { id: 'cricket', label: 'Cricket', sortOrder: 1 },
  { id: 'guides', label: 'Guides', sortOrder: 2 },
  { id: 'payments', label: 'Payments', sortOrder: 3 },
  { id: 'tips', label: 'Tips', sortOrder: 4 },
]

function rowToBlogCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function seedBlogCategoriesIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM blog_categories').get().c
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO blog_categories (id, label, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const category of DEFAULT_BLOG_CATEGORIES) {
    insert.run(category.id, category.label, category.sortOrder, now, now)
  }
  console.log(`[db] Seeded ${DEFAULT_BLOG_CATEGORIES.length} blog categories`)
}

export function listBlogCategories() {
  const rows = db.prepare(`
    SELECT * FROM blog_categories
    ORDER BY sort_order ASC, label ASC
  `).all()
  return rows.map(rowToBlogCategory)
}

export function getBlogCategory(id) {
  const row = db.prepare('SELECT * FROM blog_categories WHERE id = ?').get(id)
  return rowToBlogCategory(row)
}

export function resolveBlogCategoryLabel(id) {
  const category = getBlogCategory(id)
  return category?.label || id
}

export function createBlogCategory({ id, label, sortOrder } = {}) {
  const cleanLabel = String(label || '').trim()
  if (!cleanLabel) {
    return { error: 'Label is required' }
  }

  const categoryId = String(id || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || cleanLabel
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  if (!categoryId) {
    return { error: 'Category id is required' }
  }
  if (getBlogCategory(categoryId)) {
    return { error: 'Category id already exists' }
  }

  const now = new Date().toISOString()
  const order = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0

  db.prepare(`
    INSERT INTO blog_categories (id, label, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(categoryId, cleanLabel, order, now, now)

  return { category: getBlogCategory(categoryId) }
}

export function updateBlogCategory(id, patch = {}) {
  const existing = db.prepare('SELECT * FROM blog_categories WHERE id = ?').get(id)
  if (!existing) return { error: 'Category not found' }

  const nextLabel = patch.label !== undefined ? String(patch.label).trim() : existing.label
  if (!nextLabel) return { error: 'Label is required' }

  const nextSortOrder = patch.sortOrder !== undefined
    ? (Number.isFinite(Number(patch.sortOrder)) ? Number(patch.sortOrder) : existing.sort_order)
    : existing.sort_order

  const nextId = patch.id !== undefined
    ? String(patch.id).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : existing.id

  if (!nextId) return { error: 'Category id is required' }

  const now = new Date().toISOString()

  if (nextId !== existing.id) {
    if (getBlogCategory(nextId)) return { error: 'Category id already exists' }

    const rename = db.transaction(() => {
      db.prepare(`
        UPDATE blog_categories
        SET id = ?, label = ?, sort_order = ?, updated_at = ?
        WHERE id = ?
      `).run(nextId, nextLabel, nextSortOrder, now, existing.id)

      db.prepare(`
        UPDATE blog_posts
        SET category = ?, category_label = ?, updated_at = ?
        WHERE category = ?
      `).run(nextId, nextLabel, now, existing.id)
    })
    rename()
  } else {
    db.prepare(`
      UPDATE blog_categories
      SET label = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(nextLabel, nextSortOrder, now, existing.id)

    db.prepare(`
      UPDATE blog_posts
      SET category_label = ?, updated_at = ?
      WHERE category = ?
    `).run(nextLabel, now, existing.id)
  }

  return { category: getBlogCategory(nextId) }
}

export function deleteBlogCategory(id) {
  const existing = getBlogCategory(id)
  if (!existing) return { error: 'Category not found' }

  const postCount = db.prepare('SELECT COUNT(*) AS c FROM blog_posts WHERE category = ?').get(id).c
  if (postCount > 0) {
    return { error: `Cannot delete: ${postCount} post(s) use this category` }
  }

  db.prepare('DELETE FROM blog_categories WHERE id = ?').run(id)
  return { ok: true }
}

export function rowToBlogPost(row) {
  if (!row) return null
  let content = []
  try {
    content = JSON.parse(row.content || '[]')
  } catch {
    content = []
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    category: row.category,
    categoryLabel: row.category_label,
    author: row.author,
    date: row.published_at,
    readTime: row.read_time,
    featured: Boolean(row.featured),
    gradient: row.gradient,
    emoji: row.emoji,
    coverImage: row.cover_image || '',
    content,
    metaTitle: row.meta_title || '',
    metaDescription: row.meta_description || '',
    metaKeywords: row.meta_keywords || '',
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function seedBlogPostsIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM blog_posts').get().c
  if (count > 0) return

  import('../../src/data/blogPosts.js')
    .then(({ blogPosts }) => {
      const now = new Date().toISOString()
      const insert = db.prepare(`
        INSERT INTO blog_posts (
          slug, title, excerpt, category, category_label, author,
          published_at, read_time, featured, gradient, emoji,
          content, published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `)

      for (const post of blogPosts) {
        insert.run(
          post.slug,
          post.title,
          post.excerpt,
          post.category,
          post.categoryLabel,
          post.author,
          post.date,
          post.readTime,
          post.featured ? 1 : 0,
          post.gradient,
          post.emoji,
          JSON.stringify(post.content),
          now,
          now
        )
      }
      console.log(`[db] Seeded ${blogPosts.length} blog posts`)
    })
    .catch((err) => {
      console.warn('[db] Blog seed skipped:', err.message)
    })
}
