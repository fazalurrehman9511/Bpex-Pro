import { useState, useEffect, useMemo, useRef, Component } from 'react'
import {
  Shield,
  LogOut,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  X,
  Eye,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  Phone,
  User,
  Wallet,
  CreditCard,
  MessageCircle,
  LayoutDashboard,
  Menu,
  Users,
  FileText,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Receipt,
  Loader2,
} from 'lucide-react'
import {
  formatCurrency,
  getRemainingMs,
  formatRemaining,
} from '../utils/transactions'
import {
  fetchAdminTransactions,
  updateAdminTransaction,
  fetchBpexchUsers,
  syncBpexchUserBalances,
  syncBpexchUsersFromBpexch,
  createBpexchUser,
  fetchAdminBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  screenshotUrl,
  fetchAdminPaymentAccounts,
  updateAdminPaymentAccount,
  createAdminPaymentAccount,
  deleteAdminPaymentAccount,
  fetchAdminWhatsappAgents,
  updateAdminWhatsappAgent,
  createAdminWhatsappAgent,
  deleteAdminWhatsappAgent,
  fetchAdminExpenses,
  createAdminExpense,
  updateAdminExpense,
  deleteAdminExpense,
  fetchAdminProfitLoss,
  fetchAdminBpexchAgent,
  updateAdminBpexchAgent,
} from '../utils/api'
import { blogCategories, formatDate } from '../data/blogPosts'
import { countryCatalog, getCatalogCountry } from '../data/countryCatalog'
import { contentToHtml } from '../utils/blogContent'
import BlogRichEditor from '../components/blog/BlogRichEditor'
import {
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
} from '../utils/adminAuth'
import { BRAND_LOGO, BRAND_NAME } from '../config/brand'

const statusStyles = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  expired: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  approved: 'bg-accent/20 text-accent border-accent/40',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/40',
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await loginAdmin(username, password)
    if (result.ok) {
      onLogin()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-navy-light p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text">Super Admin Login</h1>
          <p className="mt-1 text-xs text-muted">Deposit &amp; Withdraw Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">
                Admin ID / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                autoFocus
                autoComplete="username"
                className="w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full rounded bg-accent px-4 py-3 text-sm font-bold text-navy-dark hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
        </form>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className="rounded-lg border border-border bg-navy-light px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? 'text-accent' : 'text-muted'}`} />
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
    </div>
  )
}

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState(() => getRemainingMs(expiresAt))

  useEffect(() => {
    const t = setInterval(() => setLeft(getRemainingMs(expiresAt)), 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  if (left <= 0) return <span className="text-muted">Expired</span>
  return (
    <span className="inline-flex items-center gap-1 font-mono text-amber-300">
      <Clock className="h-3 w-3" />
      {formatRemaining(left)}
    </span>
  )
}

function DetailRow({ label, value, mono = false }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className={`text-sm text-text break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function TransactionDetailModal({ tx, onClose, onApprove, onReject }) {
  const [notes, setNotes] = useState(tx.adminNotes || '')
  const [actionBusy, setActionBusy] = useState(null) // 'approve' | 'reject' | null
  const isPending = tx.status === 'pending'
  const busy = Boolean(actionBusy)

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  const runReject = async () => {
    if (busy) return
    setActionBusy('reject')
    try {
      await onReject(tx.id, notes)
    } catch {
      /* parent shows alert */
    } finally {
      setActionBusy(null)
    }
  }

  const runApprove = async () => {
    if (busy) return
    setActionBusy('approve')
    try {
      await onApprove(tx.id, notes)
    } catch {
      /* parent shows alert */
    } finally {
      setActionBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={handleClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-border bg-navy-light shadow-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-navy-light px-5 py-4">
          <div>
            <p className="font-mono text-xs text-accent">{tx.id}</p>
            <div className="mt-1 flex items-center gap-2">
              {tx.type === 'deposit' ? (
                <ArrowDownToLine className="h-4 w-4 text-accent" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4 text-back" />
              )}
              <span className="text-sm font-bold capitalize text-text">{tx.type}</span>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[tx.status] || statusStyles.pending}`}
              >
                {tx.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="cursor-pointer rounded p-1.5 text-muted hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded border border-accent/30 bg-accent/5 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted">Amount</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(tx.amount)}</p>
          </div>

          <div className="space-y-3 rounded border border-border bg-navy-dark px-4 py-3">
            <p className="text-xs font-semibold text-text flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              User Details
            </p>
            <DetailRow label="Name" value={tx.name} />
            <DetailRow label="Phone" value={tx.phone} mono />
          </div>

          <div className="space-y-3 rounded border border-border bg-navy-dark px-4 py-3">
            <p className="text-xs font-semibold text-text flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Payment Method
            </p>
            <DetailRow label="Method" value={tx.paymentMethodLabel} />
            {tx.type === 'deposit' && (
              <>
                <DetailRow label="Paid To" value={tx.accountTitle} />
                <DetailRow label="Account No." value={tx.accountNumber} mono />
                {tx.bankName && <DetailRow label="Bank" value={tx.bankName} />}
              </>
            )}
            {tx.type === 'withdraw' && (
              <>
                <DetailRow label="Payout Title" value={tx.payoutAccountTitle} />
                <DetailRow label="Payout Account" value={tx.payoutAccountNumber} mono />
                {tx.availableBalance != null && (
                  <DetailRow label="Balance at Request" value={tx.availableBalance} />
                )}
              </>
            )}
          </div>

          {tx.screenshot && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Payment Screenshot
              </p>
              <a href={screenshotUrl(tx.screenshot)} target="_blank" rel="noopener noreferrer">
                <img
                  src={screenshotUrl(tx.screenshot)}
                  alt="Payment screenshot"
                  className="w-full rounded border border-border object-contain max-h-64 bg-navy-dark"
                />
              </a>
            </div>
          )}

          <div className="space-y-2 rounded border border-border bg-navy-dark px-4 py-3 text-xs text-muted">
            <DetailRow
              label="Submitted"
              value={new Date(tx.createdAt).toLocaleString()}
            />
            <DetailRow
              label="Expires"
              value={new Date(tx.expiresAt).toLocaleString()}
            />
            {tx.reviewedAt && (
              <DetailRow
                label="Reviewed"
                value={new Date(tx.reviewedAt).toLocaleString()}
              />
            )}
            {isPending && (
              <div className="flex items-center gap-2 pt-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                <Countdown expiresAt={tx.expiresAt} />
              </div>
            )}
          </div>

          {isPending && (
            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes…"
                  disabled={busy}
                  className="w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none disabled:opacity-60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={runReject}
                  disabled={busy}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {actionBusy === 'reject' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {actionBusy === 'reject' ? 'Rejecting…' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={runApprove}
                  disabled={busy}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded bg-accent px-4 py-2.5 text-sm font-bold text-navy-dark transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
                >
                  {actionBusy === 'approve' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {actionBusy === 'approve' ? 'Approving…' : 'Approve'}
                </button>
              </div>
              {busy && (
                <p className="text-center text-[11px] text-muted">
                  BPEXCH update chal rahi hai — dobara click mat karo.
                </p>
              )}
            </div>
          )}

          {tx.adminNotes && !isPending && (
            <div className="rounded border border-border bg-navy-dark px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Admin Notes
              </p>
              <p className="mt-1 text-sm text-text">{tx.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SIDEBAR_TABS = [
  { id: 'deposit', label: 'Deposits', icon: ArrowDownToLine, section: 'transactions' },
  { id: 'withdraw', label: 'Withdraws', icon: ArrowUpFromLine, section: 'transactions' },
  { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp, section: 'finance' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, section: 'finance' },
  { id: 'users', label: 'BPEXCH Users', icon: Users, section: 'users' },
  { id: 'accounts', label: 'Payment Accounts', icon: CreditCard, section: 'settings' },
  { id: 'whatsapp', label: 'WhatsApp Agents', icon: MessageCircle, section: 'settings' },
  { id: 'blog', label: 'Blog Posts', icon: FileText, section: 'blog' },
]

const EXPENSE_CATEGORIES = [
  'general',
  'salary',
  'rent',
  'marketing',
  'software',
  'utilities',
  'transport',
  'other',
]

const BLOG_CATEGORY_OPTIONS = blogCategories.filter((c) => c.id !== 'all')

const BPEXCH_USER_TYPES = ['Bettor', 'Admin', 'Master', 'SuperMaster']

const EMPTY_BPEXCH_USER_FORM = {
  username: '',
  password: '',
  userType: 'Bettor',
  phone: '',
  reference: '',
  notes: '',
  isActive: true,
}

const EMPTY_BLOG_FORM = {
  title: '',
  excerpt: '',
  category: 'guides',
  author: 'BpxPro Team',
  emoji: '📝',
  gradient: 'from-green-600/40 to-navy-light',
  date: new Date().toISOString().slice(0, 10),
  featured: false,
  published: true,
  htmlContent: '',
}

function AdminSidebar({ activeTab, onTabChange, counts, onLogout, mobileOpen, onMobileClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-60 flex-col border-r border-border bg-navy-light transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <img
            src={BRAND_LOGO}
            alt="BPX"
            className="h-9 w-9 rounded-lg object-cover"
            decoding="async"
          />
          <div>
            <p className="text-sm font-bold text-text">{BRAND_NAME} Admin</p>
            <p className="text-[10px] text-muted">Super Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Transactions
            </p>
            {SIDEBAR_TABS.filter((t) => t.section === 'transactions').map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const pending = counts[id]?.pending || 0
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTabChange(id)
                    onMobileClose()
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {pending > 0 && (
                    <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      {pending}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Finance
            </p>
            {SIDEBAR_TABS.filter((t) => t.section === 'finance').map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTabChange(id)
                    onMobileClose()
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Users
            </p>
            {SIDEBAR_TABS.filter((t) => t.section === 'users').map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const total = counts.users?.total || 0
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTabChange(id)
                    onMobileClose()
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {total > 0 && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Settings
            </p>
            {SIDEBAR_TABS.filter((t) => t.section === 'settings').map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTabChange(id)
                    onMobileClose()
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Content
            </p>
            {SIDEBAR_TABS.filter((t) => t.section === 'blog').map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const total = counts.blog?.total || 0
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTabChange(id)
                    onMobileClose()
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {total > 0 && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

function TransactionTable({ transactions, onSelect, onApprove, onReject }) {
  if (!transactions.length) return null

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-navy-light text-muted">
            <tr>
              <th className="px-3 py-3 font-semibold">ID / Time</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">Amount</th>
              <th className="px-3 py-3 font-semibold">Method</th>
              <th className="px-3 py-3 font-semibold">Account Details</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Timer</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr key={tx.id} className="bg-navy/50 hover:bg-surface-hover/20">
                <td className="px-3 py-3">
                  <p className="font-mono text-[10px] text-accent">{tx.id}</p>
                  <p className="mt-0.5 text-muted whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-text">{tx.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-muted">
                    <Phone className="h-3 w-3" />
                    {tx.phone}
                  </p>
                </td>
                <td className="px-3 py-3 font-bold text-text">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-3 py-3 text-muted">{tx.paymentMethodLabel}</td>
                <td className="px-3 py-3 max-w-[180px]">
                  {tx.type === 'deposit' ? (
                    <div className="text-muted">
                      <p className="truncate text-text">{tx.accountTitle}</p>
                      <p className="font-mono text-[10px]">{tx.accountNumber}</p>
                      {tx.screenshot && (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-accent">
                          <ImageIcon className="h-3 w-3" />
                          Screenshot
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted">
                      <p className="truncate text-text">{tx.payoutAccountTitle}</p>
                      <p className="font-mono text-[10px]">{tx.payoutAccountNumber}</p>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[tx.status] || statusStyles.pending}`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {tx.status === 'pending' ? (
                    <Countdown expiresAt={tx.expiresAt} />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelect(tx)}
                      className="rounded p-1.5 text-muted hover:bg-surface-hover hover:text-accent transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {tx.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(tx.id)}
                          className="rounded p-1.5 text-muted hover:bg-accent/10 hover:text-accent transition-colors"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(tx.id)}
                          className="rounded p-1.5 text-muted hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="rounded-lg border border-border bg-navy-light p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] text-accent">{tx.id}</p>
                <p className="mt-1 font-bold text-text">{formatCurrency(tx.amount)}</p>
              </div>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[tx.status] || statusStyles.pending}`}
              >
                {tx.status}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-muted">{tx.paymentMethodLabel}</p>
              <p className="text-muted">
                {tx.name} · {tx.phone}
              </p>
              <p className="text-muted">
                {new Date(tx.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {tx.status === 'pending' && (
                <Countdown expiresAt={tx.expiresAt} />
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onSelect(tx)}
                className="flex-1 rounded border border-border py-2 text-xs font-semibold text-muted hover:border-accent/40 hover:text-accent transition-colors"
              >
                View Details
              </button>
              {tx.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(tx.id)}
                    className="rounded bg-accent px-3 py-2 text-xs font-bold text-navy-dark"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(tx.id)}
                    className="rounded border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function BpexchUserForm({ form, onChange, onSubmit, onCancel, saving }) {
  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-lg border border-border bg-navy-light p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-bold text-text">Add BPEXCH User Manually</h3>
      <p className="mb-4 text-[11px] text-muted">
        Existing BPEXCH users ko yahan se database mein save karein — auto-sync ke baghair.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Username *</label>
          <input
            value={form.username}
            onChange={(e) => onChange({ ...form, username: e.target.value })}
            placeholder="e.g. aliali2682"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Password *</label>
          <input
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
            placeholder="BPEXCH password"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Type</label>
          <select
            value={form.userType}
            onChange={(e) => onChange({ ...form, userType: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {BPEXCH_USER_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="03001234567"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Reference</label>
          <input
            value={form.reference}
            onChange={(e) => onChange({ ...form, reference: e.target.value })}
            placeholder="Agent / reference name"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Notes</label>
          <input
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder="Optional notes"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-text sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
            className="rounded border-border"
          />
          Active user
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save User'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function BpexchUsersPanel({
  users,
  search,
  showForm,
  form,
  setForm,
  onSubmit,
  onCancelForm,
  saving,
  onNew,
  onSyncUsers,
  syncingUsers,
  onSyncBalances,
  syncingBalances,
  agent,
  agentForm,
  setAgentForm,
  onSaveAgent,
  savingAgent,
}) {
  return (
    <>
      <div className="mb-4 rounded-lg border border-border bg-navy-light p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text">BPEXCH Agent</h3>
            <p className="mt-1 max-w-2xl text-xs text-muted">
              Super Admin yahan BPEXCH admin/agent change kar sakta hai. Save + Sync ke baad list
              mein sirf usi agent ke related users dikhenge. Deposit / Withdraw records global
              rehte hain — un pe koi filter nahi.
            </p>
          </div>
          {agent?.username ? (
            <span className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
              Active: {agent.username}
            </span>
          ) : (
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
              Not configured
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs text-muted">
            Agent username
            <input
              value={agentForm.username}
              onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })}
              autoComplete="off"
              className="mt-1 w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="BPEXCH agent login"
            />
          </label>
          <label className="block text-xs text-muted">
            Agent password
            <input
              type="password"
              value={agentForm.password}
              onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder={agent?.hasPassword ? '•••••••• (leave blank to keep)' : 'Required'}
            />
          </label>
          <label className="block text-xs text-muted">
            Label (optional)
            <input
              value={agentForm.label}
              onChange={(e) => setAgentForm({ ...agentForm, label: e.target.value })}
              className="mt-1 w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Active BPEXCH Agent"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveAgent}
            disabled={savingAgent || syncingUsers || !agentForm.username.trim()}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
          >
            <Shield className="h-3.5 w-3.5" />
            {savingAgent ? 'Saving…' : 'Save Agent & Sync Users'}
          </button>
          {agent?.updatedAt ? (
            <span className="text-[10px] text-muted">
              Last updated{' '}
              {new Date(agent.updatedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {agent.source ? ` · ${agent.source}` : ''}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onSyncUsers}
          disabled={syncingUsers || syncingBalances || savingAgent}
          className="inline-flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold text-accent hover:bg-accent/20 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncingUsers ? 'animate-spin' : ''}`} />
          {syncingUsers ? 'Importing users…' : 'Sync Users from BPEXCH'}
        </button>
        <button
          type="button"
          onClick={onSyncBalances}
          disabled={syncingBalances || syncingUsers || savingAgent}
          className="inline-flex items-center gap-1.5 rounded border border-border px-4 py-2 text-xs font-bold text-muted hover:border-accent/40 hover:text-accent disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncingBalances ? 'animate-spin' : ''}`} />
          {syncingBalances ? 'Syncing balances…' : 'Sync Balances'}
        </button>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Add User Manually
        </button>
      </div>

      {showForm && (
        <BpexchUserForm
          form={form}
          onChange={setForm}
          onSubmit={onSubmit}
          onCancel={onCancelForm}
          saving={saving}
        />
      )}

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted/40" />
          <p className="mt-3 text-sm text-muted">
            {search.trim()
              ? 'No users match your search.'
              : agent?.username
                ? `No users for agent “${agent.username}” yet.`
                : 'No BPEXCH users in database yet.'}
          </p>
          <p className="mt-1 text-xs text-muted/70">
            {search.trim()
              ? 'Try a different search term.'
              : 'Click "Sync Users from BPEXCH" to import this agent’s clients, or add manually.'}
          </p>
        </div>
      ) : (
        <BpexchUsersTable users={users} />
      )}
    </>
  )
}

function BpexchUsersTable({ users }) {
  if (!users.length) return null

  return (
    <>
      <div className="hidden max-h-[min(70vh,calc(100dvh-16rem))] overflow-auto rounded-lg border border-border lg:block">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="sticky top-0 z-10 bg-navy-light text-muted shadow-sm">
            <tr>
              <th className="px-3 py-3 font-semibold">Username</th>
              <th className="px-3 py-3 font-semibold">Password</th>
              <th className="px-3 py-3 font-semibold">Balance</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Phone</th>
              <th className="px-3 py-3 font-semibold">Reference</th>
              <th className="px-3 py-3 font-semibold">Agent</th>
              <th className="px-3 py-3 font-semibold">Active</th>
              <th className="px-3 py-3 font-semibold">Source</th>
              <th className="px-3 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="bg-navy/50 hover:bg-surface-hover/20">
                <td className="px-3 py-3 font-semibold text-accent">{user.username}</td>
                <td className="px-3 py-3 font-mono text-text">{user.password || '—'}</td>
                <td className="px-3 py-3 font-semibold text-accent whitespace-nowrap">
                  {user.balance == null ? '—' : formatCurrency(user.balance)}
                </td>
                <td className="px-3 py-3 text-text">{user.userType}</td>
                <td className="px-3 py-3 text-muted">{user.phone || '—'}</td>
                <td className="px-3 py-3 text-muted">{user.reference || '—'}</td>
                <td className="px-3 py-3 text-muted">{user.agentUsername || '—'}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      user.isActive
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                    }`}
                  >
                    {user.isActive ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      user.source === 'manual'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                    }`}
                  >
                    {user.source === 'manual' ? 'Manual' : 'Sync'}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-h-[min(70vh,calc(100dvh-16rem))] space-y-3 overflow-y-auto lg:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-border bg-navy-light p-4">
            <p className="font-semibold text-accent">{user.username}</p>
            <p className="mt-1 font-mono text-xs text-text">Pass: {user.password || '—'}</p>
            <p className="mt-1 text-sm font-bold text-accent">
              Balance: {user.balance == null ? '—' : formatCurrency(user.balance)}
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted">
              <p>Type: {user.userType}</p>
              <p>Phone: {user.phone || '—'}</p>
              <p>Reference: {user.reference || '—'}</p>
              <p>Agent: {user.agentUsername || '—'}</p>
              <p>Active: {user.isActive ? 'Yes' : 'No'}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function BlogPostForm({ form, onChange, onSubmit, onCancel, saving, editing, editorKey }) {
  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-lg border border-border bg-navy-light p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-bold text-text">
        {editing ? 'Edit Blog Post' : 'New Blog Post'}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-text">Title *</label>
          <input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-text">Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => onChange({ ...form, excerpt: e.target.value })}
            rows={2}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Category</label>
          <select
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {BLOG_CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Author</label>
          <input
            value={form.author}
            onChange={(e) => onChange({ ...form, author: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Emoji</label>
          <input
            value={form.emoji}
            onChange={(e) => onChange({ ...form, emoji: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => onChange({ ...form, date: e.target.value })}
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-text">Gradient classes</label>
          <input
            value={form.gradient}
            onChange={(e) => onChange({ ...form, gradient: e.target.value })}
            placeholder="from-green-600/40 to-navy-light"
            className="w-full rounded border border-border bg-navy px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-text">Content</label>
          <p className="mb-2 text-[10px] text-muted">
            Use the toolbar for font, size, bold, lists, links, and images.
          </p>
          <BlogRichEditor
            key={editorKey}
            value={form.htmlContent}
            onChange={(html) => onChange({ ...form, htmlContent: html })}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-text">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => onChange({ ...form, featured: e.target.checked })}
            className="rounded border-border"
          />
          Featured post
        </label>
        <label className="flex items-center gap-2 text-xs text-text">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => onChange({ ...form, published: e.target.checked })}
            className="rounded border-border"
          />
          Published (visible on site)
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Update Post' : 'Publish Post'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function BlogPostsPanel({ posts, search, onEdit, onDelete, showForm, form, setForm, onSubmit, onCancelForm, saving, editingId, onNew }) {
  const filtered = posts.filter((post) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.categoryLabel.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          New Post
        </button>
      </div>

      {showForm && (
        <BlogPostForm
          form={form}
          onChange={setForm}
          onSubmit={onSubmit}
          onCancel={onCancelForm}
          saving={saving}
          editing={Boolean(editingId)}
          editorKey={editingId || 'new'}
        />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted/40" />
          <p className="mt-3 text-sm text-muted">No blog posts yet.</p>
          <p className="mt-1 text-xs text-muted/70">Click &quot;New Post&quot; to publish your first article.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-border bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Title</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="border-b border-border/60 hover:bg-surface-hover/40">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-text">{post.emoji} {post.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">/blog/{post.slug}</p>
                  </td>
                  <td className="px-3 py-3 text-muted">{post.categoryLabel}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(post.date)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      post.published ? 'bg-accent/20 text-accent' : 'bg-amber-500/20 text-amber-200'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.featured && (
                      <span className="ml-1 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-200">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-border px-2 py-1 text-[10px] font-semibold text-muted hover:text-accent"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => onEdit(post)}
                        className="rounded border border-border p-1.5 text-muted hover:text-accent"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(post)}
                        className="rounded border border-border p-1.5 text-muted hover:text-red-300"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ProfitLossPanel({ summary, dateFrom, dateTo, onDateFrom, onDateTo, onClear, loading }) {
  if (loading && !summary) {
    return <p className="text-sm text-muted">Loading profit & loss…</p>
  }

  const s = summary || {
    deposits: 0,
    depositCount: 0,
    withdraws: 0,
    withdrawCount: 0,
    expenses: 0,
    expenseCount: 0,
    cashflow: 0,
    netProfit: 0,
    byCategory: [],
  }
  const profit = s.netProfit >= 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Approved deposits − withdraws − expenses. Date filter optional.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFrom(e.target.value)}
              className="rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateTo(e.target.value)}
              className="rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={onClear}
              className="rounded border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:text-accent"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Deposits" value={formatCurrency(s.deposits)} icon={ArrowDownToLine} accent />
        <StatCard label="Withdraws" value={formatCurrency(s.withdraws)} icon={ArrowUpFromLine} />
        <StatCard label="Expenses" value={formatCurrency(s.expenses)} icon={Receipt} />
        <StatCard
          label={profit ? 'Net Profit' : 'Net Loss'}
          value={formatCurrency(Math.abs(s.netProfit))}
          icon={TrendingUp}
          accent={profit}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-navy-light p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Cashflow</p>
          <p className={`mt-1 text-lg font-bold ${s.cashflow >= 0 ? 'text-accent' : 'text-red-300'}`}>
            {formatCurrency(s.cashflow)}
          </p>
          <p className="mt-1 text-[10px] text-muted">Deposits − Withdraws</p>
        </div>
        <div className="rounded-xl border border-border bg-navy-light p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Deposit count</p>
          <p className="mt-1 text-lg font-bold text-text">{s.depositCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-navy-light p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Withdraw count</p>
          <p className="mt-1 text-lg font-bold text-text">{s.withdrawCount}</p>
        </div>
      </div>

      {s.byCategory?.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[400px] text-left text-xs">
            <thead className="bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-3 font-semibold">Expense category</th>
                <th className="px-3 py-3 font-semibold">Count</th>
                <th className="px-3 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.byCategory.map((row) => (
                <tr key={row.category} className="bg-navy/50">
                  <td className="px-3 py-2.5 font-semibold capitalize text-text">{row.category}</td>
                  <td className="px-3 py-2.5 text-muted">{row.count}</td>
                  <td className="px-3 py-2.5 font-bold text-text">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpensesPanel({
  expenses,
  onCreate,
  onSave,
  onDelete,
  creating,
  savingId,
  deletingId,
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
  onClearDates,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [form, setForm] = useState({
    title: '',
    category: 'general',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  useEffect(() => {
    const next = {}
    for (const e of expenses) {
      next[e.id] = {
        title: e.title || '',
        category: e.category || 'general',
        amount: String(e.amount ?? ''),
        expenseDate: e.expenseDate || '',
        notes: e.notes || '',
      }
    }
    setDrafts(next)
  }, [expenses])

  const handleCreate = async () => {
    const created = await onCreate({
      ...form,
      amount: Number(form.amount),
    })
    if (created) {
      setForm({
        title: '',
        category: 'general',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        notes: '',
      })
      setShowAdd(false)
    }
  }

  const inputClass =
    'w-full min-w-0 rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text'
  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Business expenses add/edit karo. Total: <span className="font-bold text-text">{formatCurrency(total)}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFrom(e.target.value)}
              className="rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateTo(e.target.value)}
              className="rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={onClearDates}
              className="rounded border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:text-accent"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-navy-dark"
          >
            <Plus className="h-3.5 w-3.5" />
            {showAdd ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="mb-3 text-sm font-bold text-text">Add expense</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted sm:col-span-2">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Office rent"
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text capitalize"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Amount
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted">
              Date
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={creating || !form.title.trim() || !form.amount}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
          >
            {creating ? 'Adding…' : 'Add Expense'}
          </button>
        </div>
      )}

      {!expenses.length ? (
        <p className="text-sm text-muted">No expenses yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Title</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Notes</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => {
                const draft = drafts[expense.id] || {
                  title: '',
                  category: 'general',
                  amount: '',
                  expenseDate: '',
                  notes: '',
                }
                const busy = savingId === expense.id
                const deleting = deletingId === expense.id
                const patch = (field, value) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [expense.id]: { ...draft, [field]: value },
                  }))
                return (
                  <tr key={expense.id} className="bg-navy/50 hover:bg-surface-hover/20">
                    <td className="px-3 py-2.5">
                      <input
                        type="date"
                        value={draft.expenseDate}
                        onChange={(e) => patch('expenseDate', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.title}
                        onChange={(e) => patch('title', e.target.value)}
                        className={`${inputClass} min-w-[120px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={draft.category}
                        onChange={(e) => patch('category', e.target.value)}
                        className={`${inputClass} capitalize`}
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min="0"
                        value={draft.amount}
                        onChange={(e) => patch('amount', e.target.value)}
                        className={`${inputClass} w-24 font-mono`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.notes}
                        onChange={(e) => patch('notes', e.target.value)}
                        className={`${inputClass} min-w-[100px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            onSave(expense.id, {
                              ...draft,
                              amount: Number(draft.amount),
                            })
                          }
                          className="rounded bg-accent px-2.5 py-1.5 text-[10px] font-bold text-navy-dark disabled:opacity-60"
                        >
                          {busy ? '…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            if (window.confirm(`Delete expense "${expense.title}"?`)) {
                              onDelete(expense.id)
                            }
                          }}
                          className="inline-flex items-center rounded border border-red-500/40 px-2 py-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PaymentAccountsPanel({
  accounts,
  onSave,
  onCreate,
  onDelete,
  savingId,
  creating,
  deletingId,
}) {
  const [drafts, setDrafts] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [newAccount, setNewAccount] = useState({
    label: '',
    id: '',
    accountTitle: '',
    accountNumber: '',
    bankName: '',
  })

  useEffect(() => {
    const next = {}
    for (const a of accounts) {
      next[a.id] = {
        label: a.label || '',
        accountTitle: a.accountTitle || '',
        accountNumber: a.accountNumber || '',
        bankName: a.bankName || '',
      }
    }
    setDrafts(next)
  }, [accounts])

  const slugFromLabel = (label) =>
    String(label || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32)

  const handleCreate = async () => {
    const payload = {
      ...newAccount,
      id: newAccount.id.trim() || slugFromLabel(newAccount.label),
    }
    const created = await onCreate(payload)
    if (created) {
      setNewAccount({
        label: '',
        id: '',
        accountTitle: '',
        accountNumber: '',
        bankName: '',
      })
      setShowAdd(false)
    }
  }

  const inputClass =
    'w-full min-w-0 rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Yeh details deposit / withdraw screens pe show hoti hain. Naya method Add se add karo.
        </p>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-navy-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAdd ? 'Cancel' : 'Add Payment Method'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="mb-3 text-sm font-bold text-text">Add new payment method</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Display name
              <input
                value={newAccount.label}
                onChange={(e) => {
                  const label = e.target.value
                  setNewAccount((p) => ({
                    ...p,
                    label,
                    id: p.id || slugFromLabel(label),
                  }))
                }}
                placeholder="NayaPay"
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted">
              Id (slug)
              <input
                value={newAccount.id}
                onChange={(e) =>
                  setNewAccount((p) => ({
                    ...p,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }))
                }
                placeholder="nayapay"
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text font-mono"
              />
            </label>
            <label className="block text-xs text-muted">
              Account Title / Name
              <input
                value={newAccount.accountTitle}
                onChange={(e) => setNewAccount((p) => ({ ...p, accountTitle: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted">
              Account Number
              <input
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount((p) => ({ ...p, accountNumber: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="block text-xs text-muted sm:col-span-2">
              Bank / Wallet name
              <input
                value={newAccount.bankName}
                onChange={(e) => setNewAccount((p) => ({ ...p, bankName: e.target.value }))}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={creating || !newAccount.label.trim()}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
          >
            {creating ? 'Adding…' : 'Add Payment Method'}
          </button>
        </div>
      )}

      {!accounts.length ? (
        <p className="text-sm text-muted">No payment accounts yet. Add a method above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-3 font-semibold">Method</th>
                <th className="px-3 py-3 font-semibold">Account Title</th>
                <th className="px-3 py-3 font-semibold">Account Number</th>
                <th className="px-3 py-3 font-semibold">Bank / Wallet</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((account) => {
                const draft = drafts[account.id] || {
                  label: '',
                  accountTitle: '',
                  accountNumber: '',
                  bankName: '',
                }
                const busy = savingId === account.id
                const deleting = deletingId === account.id
                const patch = (field, value) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [account.id]: { ...draft, [field]: value },
                  }))

                return (
                  <tr key={account.id} className="bg-navy/50 hover:bg-surface-hover/20">
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.label}
                        onChange={(e) => patch('label', e.target.value)}
                        className={`${inputClass} min-w-[100px] font-semibold`}
                      />
                      <p className="mt-0.5 text-[10px] text-muted font-mono">{account.id}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.accountTitle}
                        onChange={(e) => patch('accountTitle', e.target.value)}
                        className={`${inputClass} min-w-[120px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.accountNumber}
                        onChange={(e) => patch('accountNumber', e.target.value)}
                        className={`${inputClass} font-mono min-w-[120px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.bankName}
                        onChange={(e) => patch('bankName', e.target.value)}
                        className={`${inputClass} min-w-[110px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSave(account.id, draft)}
                          className="rounded bg-accent px-2.5 py-1.5 text-[10px] font-bold text-navy-dark disabled:opacity-60"
                        >
                          {busy ? '…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            if (window.confirm(`Delete ${account.label} (${account.id})?`)) {
                              onDelete(account.id)
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded border border-red-500/40 px-2 py-1.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function WhatsappAgentsPanel({
  agents,
  onSave,
  onCreate,
  onDelete,
  savingCode,
  creating,
  deletingCode,
}) {
  const [drafts, setDrafts] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [newAgent, setNewAgent] = useState({
    code: '',
    name: '',
    flag: '',
    dialCode: '',
    phonePlaceholder: '',
    whatsapp: '',
    isActive: true,
  })

  useEffect(() => {
    const next = {}
    for (const a of agents) {
      next[a.code] = {
        whatsapp: a.whatsapp || '',
        name: a.name || '',
        flag: a.flag || '',
        dialCode: a.dialCode || '',
        phonePlaceholder: a.phonePlaceholder || '',
        isActive: a.isActive !== false,
      }
    }
    setDrafts(next)
  }, [agents])

  const handleCreate = async () => {
    const created = await onCreate(newAgent)
    if (created) {
      setNewAgent({
        code: '',
        name: '',
        flag: '',
        dialCode: '',
        phonePlaceholder: '',
        whatsapp: '',
        isActive: true,
      })
      setShowAdd(false)
    }
  }

  const existingCodes = new Set(agents.map((a) => a.code))
  const availableCountries = countryCatalog.filter((c) => !existingCodes.has(c.code))

  const selectCountry = (code) => {
    const c = getCatalogCountry(code)
    if (!c) {
      setNewAgent((p) => ({
        ...p,
        code: '',
        name: '',
        flag: '',
        dialCode: '',
        phonePlaceholder: '',
      }))
      return
    }
    setNewAgent((p) => ({
      ...p,
      code: c.code,
      name: c.name,
      flag: c.flag,
      dialCode: c.dialCode,
      phonePlaceholder: c.phonePlaceholder,
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Register → WhatsApp Agent tab pe yeh countries aur numbers dikhte hain. Number country
          code ke sath digits mein likhein (e.g. 923001234567). Naya country Add se add karo.
        </p>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-navy-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAdd ? 'Cancel' : 'Add Country'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="mb-3 text-sm font-bold text-text">Add new country / agent</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted sm:col-span-2">
              Select country
              <select
                value={newAgent.code}
                onChange={(e) => selectCountry(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              >
                <option value="">Choose a country…</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code}) — {c.dialCode}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Country code
              <input
                value={newAgent.code}
                readOnly
                className="mt-1 w-full rounded border border-border bg-navy-dark/60 px-3 py-2 text-sm text-muted"
              />
            </label>
            <label className="block text-xs text-muted">
              Display name
              <input
                value={newAgent.name}
                readOnly
                className="mt-1 w-full rounded border border-border bg-navy-dark/60 px-3 py-2 text-sm text-muted"
              />
            </label>
            <label className="block text-xs text-muted">
              Flag
              <input
                value={newAgent.flag}
                readOnly
                className="mt-1 w-full rounded border border-border bg-navy-dark/60 px-3 py-2 text-sm text-muted"
              />
            </label>
            <label className="block text-xs text-muted">
              Dial code
              <input
                value={newAgent.dialCode}
                readOnly
                className="mt-1 w-full rounded border border-border bg-navy-dark/60 px-3 py-2 text-sm text-muted"
              />
            </label>
            <label className="block text-xs text-muted sm:col-span-2">
              WhatsApp number (with country code, digits only)
              <input
                value={newAgent.whatsapp}
                onChange={(e) => setNewAgent((p) => ({ ...p, whatsapp: e.target.value }))}
                placeholder={
                  newAgent.dialCode
                    ? `${newAgent.dialCode.replace(/\D/g, '')}…`
                    : '12025550123'
                }
                className="mt-1 w-full rounded border border-border bg-navy-dark px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted self-end pb-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={newAgent.isActive}
                onChange={(e) => setNewAgent((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Active
            </label>
          </div>
          <button
            type="button"
            disabled={creating || !newAgent.code}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-navy-dark disabled:opacity-60"
          >
            {creating ? 'Adding…' : 'Add Country'}
          </button>
        </div>
      )}

      {!agents.length ? (
        <p className="text-sm text-muted">No WhatsApp agents yet. Add a country above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-navy-light text-muted">
              <tr>
                <th className="px-3 py-3 font-semibold">Country</th>
                <th className="px-3 py-3 font-semibold">WhatsApp</th>
                <th className="px-3 py-3 font-semibold">Dial</th>
                <th className="px-3 py-3 font-semibold">Placeholder</th>
                <th className="px-3 py-3 font-semibold text-center">Active</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((agent) => {
                const draft = drafts[agent.code] || {
                  whatsapp: '',
                  name: '',
                  flag: '',
                  dialCode: '',
                  phonePlaceholder: '',
                  isActive: true,
                }
                const busy = savingCode === agent.code
                const deleting = deletingCode === agent.code
                const patch = (field, value) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [agent.code]: { ...draft, [field]: value },
                  }))
                const inputClass =
                  'w-full min-w-0 rounded border border-border bg-navy-dark px-2 py-1.5 text-xs text-text'

                return (
                  <tr key={agent.code} className="bg-navy/50 hover:bg-surface-hover/20">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{draft.flag || agent.flag}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate">{draft.name || agent.name}</p>
                          <p className="text-[10px] text-muted">{agent.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.whatsapp}
                        onChange={(e) => patch('whatsapp', e.target.value)}
                        placeholder="923001234567"
                        className={`${inputClass} font-mono min-w-[140px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.dialCode}
                        onChange={(e) => patch('dialCode', e.target.value)}
                        placeholder="+92"
                        className={`${inputClass} w-20`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={draft.phonePlaceholder}
                        onChange={(e) => patch('phonePlaceholder', e.target.value)}
                        className={`${inputClass} min-w-[110px]`}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(e) => patch('isActive', e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                        title="Show in WhatsApp Agent register"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSave(agent.code, draft)}
                          className="rounded bg-accent px-2.5 py-1.5 text-[10px] font-bold text-navy-dark disabled:opacity-60"
                        >
                          {busy ? '…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            if (window.confirm(`Delete ${agent.name} (${agent.code})?`)) {
                              onDelete(agent.code)
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded border border-red-500/40 px-2 py-1.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminDashboard({ onLogout }) {
  const [allTransactions, setAllTransactions] = useState([])
  const [bpexchUsers, setBpexchUsers] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState('deposit')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const statusLockRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM)
  const [editingBlogId, setEditingBlogId] = useState(null)
  const [blogSaving, setBlogSaving] = useState(false)
  const [showBpexchForm, setShowBpexchForm] = useState(false)
  const [bpexchForm, setBpexchForm] = useState(EMPTY_BPEXCH_USER_FORM)
  const [bpexchSaving, setBpexchSaving] = useState(false)
  const [syncingBalances, setSyncingBalances] = useState(false)
  const [syncingUsers, setSyncingUsers] = useState(false)
  const [bpexchAgent, setBpexchAgent] = useState(null)
  const [bpexchAgentForm, setBpexchAgentForm] = useState({
    username: '',
    password: '',
    label: '',
  })
  const [savingBpexchAgent, setSavingBpexchAgent] = useState(false)
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [savingAccountId, setSavingAccountId] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [deletingAccountId, setDeletingAccountId] = useState('')
  const [whatsappAgents, setWhatsappAgents] = useState([])
  const [savingWhatsappCode, setSavingWhatsappCode] = useState('')
  const [creatingWhatsapp, setCreatingWhatsapp] = useState(false)
  const [deletingWhatsappCode, setDeletingWhatsappCode] = useState('')
  const [expenses, setExpenses] = useState([])
  const [pnlSummary, setPnlSummary] = useState(null)
  const [financeDateFrom, setFinanceDateFrom] = useState('')
  const [financeDateTo, setFinanceDateTo] = useState('')
  const [creatingExpense, setCreatingExpense] = useState(false)
  const [savingExpenseId, setSavingExpenseId] = useState('')
  const [deletingExpenseId, setDeletingExpenseId] = useState('')

  const isUsersTab = activeTab === 'users'
  const isBlogTab = activeTab === 'blog'
  const isAccountsTab = activeTab === 'accounts'
  const isWhatsappTab = activeTab === 'whatsapp'
  const isPnlTab = activeTab === 'pnl'
  const isExpensesTab = activeTab === 'expenses'
  const isFinanceTab = isPnlTab || isExpensesTab
  const isSettingsPanel = isAccountsTab || isWhatsappTab || isFinanceTab

  const loadTransactions = async ({ silent = false } = {}) => {
    if (isUsersTab || isBlogTab || isSettingsPanel) return
    if (!silent) {
      setLoading(true)
      setLoadError('')
    }
    try {
      const list = await fetchAdminTransactions({ status: statusFilter })
      setAllTransactions(Array.isArray(list) ? list : [])
    } catch (err) {
      setAllTransactions([])
      if (!silent) setLoadError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadUsers = async ({ silent = false } = {}) => {
    if (!isUsersTab) return
    if (!silent) {
      setLoading(true)
      setLoadError('')
    }
    try {
      const [list, agent] = await Promise.all([
        fetchBpexchUsers(),
        fetchAdminBpexchAgent().catch(() => null),
      ])
      setBpexchUsers(Array.isArray(list) ? list : [])
      if (agent && !silent) {
        // Only hydrate agent form on initial/manual load — never wipe while typing
        setBpexchAgent(agent)
        setBpexchAgentForm((prev) => ({
          username: agent.username || prev.username || '',
          password: '',
          label: agent.label || prev.label || '',
        }))
      } else if (agent && silent) {
        setBpexchAgent(agent)
      }
    } catch (err) {
      setBpexchUsers([])
      if (!silent) setLoadError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleSyncBalances = async () => {
    setSyncingBalances(true)
    setLoadError('')
    try {
      const data = await syncBpexchUserBalances()
      if (Array.isArray(data.users)) setBpexchUsers(data.users)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setSyncingBalances(false)
    }
  }

  const handleSyncUsersFromBpexch = async () => {
    setSyncingUsers(true)
    setLoadError('')
    try {
      const data = await syncBpexchUsersFromBpexch({ withBalances: true })
      if (Array.isArray(data.users)) setBpexchUsers(data.users)
      if (data.agentUsername) {
        setBpexchAgent((prev) =>
          prev ? { ...prev, username: data.agentUsername } : { username: data.agentUsername },
        )
      }
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setSyncingUsers(false)
    }
  }

  const handleSaveBpexchAgent = async () => {
    setSavingBpexchAgent(true)
    setLoadError('')
    try {
      const payload = {
        username: bpexchAgentForm.username.trim(),
        label: bpexchAgentForm.label.trim(),
      }
      if (bpexchAgentForm.password.trim()) {
        payload.password = bpexchAgentForm.password.trim()
      }
      const updated = await updateAdminBpexchAgent(payload)
      setBpexchAgent(updated)
      setBpexchAgentForm({
        username: updated.username || '',
        password: '',
        label: updated.label || '',
      })
      const data = await syncBpexchUsersFromBpexch({ withBalances: true })
      if (Array.isArray(data.users)) setBpexchUsers(data.users)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setSavingBpexchAgent(false)
    }
  }

  const loadBlogPosts = async () => {
    if (!isBlogTab) return
    setLoading(true)
    setLoadError('')
    try {
      const list = await fetchAdminBlogPosts()
      setBlogPosts(list)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentAccountsAdmin = async () => {
    if (!isAccountsTab) return
    setLoading(true)
    setLoadError('')
    try {
      const list = await fetchAdminPaymentAccounts()
      setPaymentAccounts(list)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadWhatsappAgentsAdmin = async () => {
    if (!isWhatsappTab) return
    setLoading(true)
    setLoadError('')
    try {
      const list = await fetchAdminWhatsappAgents()
      setWhatsappAgents(list)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadExpensesAdmin = async () => {
    if (!isExpensesTab) return
    setLoading(true)
    setLoadError('')
    try {
      const list = await fetchAdminExpenses({
        dateFrom: financeDateFrom || undefined,
        dateTo: financeDateTo || undefined,
      })
      setExpenses(list)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProfitLossAdmin = async () => {
    if (!isPnlTab) return
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchAdminProfitLoss({
        dateFrom: financeDateFrom || undefined,
        dateTo: financeDateTo || undefined,
      })
      setPnlSummary(data)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    if (isUsersTab) return loadUsers()
    if (isBlogTab) return loadBlogPosts()
    if (isAccountsTab) return loadPaymentAccountsAdmin()
    if (isWhatsappTab) return loadWhatsappAgentsAdmin()
    if (isExpensesTab) return loadExpensesAdmin()
    if (isPnlTab) return loadProfitLossAdmin()
    return loadTransactions()
  }

  useEffect(() => {
    document.title = 'Admin — BpxPro'
    if (isUsersTab) {
      loadUsers({ silent: false })
      // Silent list refresh only — do not reset agent form / full-page loading
      const tick = setInterval(() => loadUsers({ silent: true }), 60_000)
      return () => clearInterval(tick)
    }
    if (isBlogTab) {
      loadBlogPosts()
      return undefined
    }
    if (isAccountsTab) {
      loadPaymentAccountsAdmin()
      return undefined
    }
    if (isWhatsappTab) {
      loadWhatsappAgentsAdmin()
      return undefined
    }
    if (isExpensesTab) {
      loadExpensesAdmin()
      return undefined
    }
    if (isPnlTab) {
      loadProfitLossAdmin()
      return undefined
    }
    loadTransactions({ silent: false })
    const tick = setInterval(() => loadTransactions({ silent: true }), 60_000)
    return () => clearInterval(tick)
  }, [statusFilter, activeTab, financeDateFrom, financeDateTo])

  const tabTransactions = useMemo(
    () =>
      isUsersTab || isBlogTab || isSettingsPanel
        ? []
        : (Array.isArray(allTransactions) ? allTransactions : []).filter(
            (tx) => tx.type === activeTab,
          ),
    [allTransactions, activeTab, isUsersTab, isBlogTab, isSettingsPanel]
  )

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const users = Array.isArray(bpexchUsers) ? bpexchUsers : []
    return users.filter((user) => {
      if (!q) return true
      return (
        String(user.username || '').toLowerCase().includes(q) ||
        String(user.phone || '').toLowerCase().includes(q) ||
        String(user.userType || '').toLowerCase().includes(q) ||
        String(user.reference || '').toLowerCase().includes(q)
      )
    })
  }, [bpexchUsers, search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
    const rows = Array.isArray(tabTransactions) ? tabTransactions : []

    return rows.filter((tx) => {
      if (!tx || typeof tx !== 'object') return false
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false
      if (methodFilter !== 'all') {
        const mid = String(tx.paymentMethodId || '').toLowerCase()
        const mlabel = String(tx.paymentMethodLabel || '').toLowerCase()
        if (mid !== methodFilter && mlabel !== methodFilter) return false
      }
      if (fromMs != null || toMs != null) {
        const t = new Date(tx.createdAt).getTime()
        if (Number.isNaN(t)) return false
        if (fromMs != null && t < fromMs) return false
        if (toMs != null && t > toMs) return false
      }
      if (!q) return true
      const hay = [
        tx.id,
        tx.name,
        tx.phone,
        tx.paymentMethodLabel,
        tx.accountNumber,
        tx.payoutAccountNumber,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ')
      return hay.includes(q)
    })
  }, [tabTransactions, statusFilter, methodFilter, dateFrom, dateTo, search])

  const methodOptions = useMemo(() => {
    const map = new Map()
    for (const tx of tabTransactions) {
      const id = String(tx.paymentMethodId || '').toLowerCase()
      const label = tx.paymentMethodLabel || id
      if (id) map.set(id, label)
      else if (label) map.set(label.toLowerCase(), label)
    }
    for (const a of paymentAccounts) {
      if (a.id && !map.has(a.id)) map.set(a.id, a.label || a.id)
    }
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tabTransactions, paymentAccounts])

  const clearTxFilters = () => {
    setStatusFilter('all')
    setMethodFilter('all')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  const hasTxFilters =
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    !!dateFrom ||
    !!dateTo ||
    !!search.trim()

  const sidebarCounts = useMemo(() => {
    const txs = Array.isArray(allTransactions) ? allTransactions : []
    const users = Array.isArray(bpexchUsers) ? bpexchUsers : []
    const posts = Array.isArray(blogPosts) ? blogPosts : []
    return {
      deposit: {
        total: txs.filter((t) => t.type === 'deposit').length,
        pending: txs.filter((t) => t.type === 'deposit' && t.status === 'pending').length,
      },
      withdraw: {
        total: txs.filter((t) => t.type === 'withdraw').length,
        pending: txs.filter((t) => t.type === 'withdraw' && t.status === 'pending').length,
      },
      users: {
        total: users.length,
      },
      blog: {
        total: posts.length,
      },
    }
  }, [allTransactions, bpexchUsers, blogPosts])

  const stats = useMemo(() => {
    const list = Array.isArray(filtered) ? filtered : []
    return {
      total: list.length,
      pending: list.filter((t) => t.status === 'pending').length,
      approved: list.filter((t) => t.status === 'approved').length,
      rejected: list.filter((t) => t.status === 'rejected').length,
      approvedAmount: list
        .filter((t) => t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0),
    }
  }, [filtered])

  const handleStatus = async (id, status, notes) => {
    if (statusLockRef.current) {
      throw new Error('Pehle wali approve/reject request abhi puri nahi hui.')
    }
    statusLockRef.current = id
    try {
      const updated = await updateAdminTransaction(id, status, notes)
      setAllTransactions((prev) => prev.map((tx) => (tx.id === id ? updated : tx)))
      setSelectedTx(null)
      if (status === 'approved' && updated?.bpexch) {
        const sign = updated.type === 'deposit' ? '+' : '-'
        window.alert(
          `Approved.\nBPEXCH pe ${sign}${updated.amount} update ho gaya (${updated.name}).`,
        )
      }
    } catch (err) {
      alert(err.message)
      throw err
    } finally {
      statusLockRef.current = null
    }
  }

  const handleSavePaymentAccount = async (id, draft) => {
    setSavingAccountId(id)
    try {
      const updated = await updateAdminPaymentAccount(id, draft)
      setPaymentAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingAccountId('')
    }
  }

  const handleCreatePaymentAccount = async (payload) => {
    setCreatingAccount(true)
    try {
      const created = await createAdminPaymentAccount(payload)
      setPaymentAccounts((prev) => [...prev, created].sort((a, b) => a.id.localeCompare(b.id)))
      return created
    } catch (err) {
      alert(err.message)
      return null
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleDeletePaymentAccount = async (id) => {
    setDeletingAccountId(id)
    try {
      await deleteAdminPaymentAccount(id)
      setPaymentAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingAccountId('')
    }
  }

  const handleSaveWhatsappAgent = async (code, draft) => {
    setSavingWhatsappCode(code)
    try {
      const updated = await updateAdminWhatsappAgent(code, draft)
      setWhatsappAgents((prev) => prev.map((a) => (a.code === code ? updated : a)))
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingWhatsappCode('')
    }
  }

  const handleCreateWhatsappAgent = async (payload) => {
    setCreatingWhatsapp(true)
    try {
      const created = await createAdminWhatsappAgent(payload)
      setWhatsappAgents((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
      return created
    } catch (err) {
      alert(err.message)
      return null
    } finally {
      setCreatingWhatsapp(false)
    }
  }

  const handleDeleteWhatsappAgent = async (code) => {
    setDeletingWhatsappCode(code)
    try {
      await deleteAdminWhatsappAgent(code)
      setWhatsappAgents((prev) => prev.filter((a) => a.code !== code))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingWhatsappCode('')
    }
  }

  const handleCreateExpense = async (payload) => {
    setCreatingExpense(true)
    try {
      const created = await createAdminExpense(payload)
      setExpenses((prev) => [created, ...prev])
      return created
    } catch (err) {
      alert(err.message)
      return null
    } finally {
      setCreatingExpense(false)
    }
  }

  const handleSaveExpense = async (id, draft) => {
    setSavingExpenseId(id)
    try {
      const updated = await updateAdminExpense(id, draft)
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingExpenseId('')
    }
  }

  const handleDeleteExpense = async (id) => {
    setDeletingExpenseId(id)
    try {
      await deleteAdminExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingExpenseId('')
    }
  }

  const resetBlogForm = () => {
    setBlogForm(EMPTY_BLOG_FORM)
    setEditingBlogId(null)
    setShowBlogForm(false)
  }

  const handleNewBlogPost = () => {
    setBlogForm(EMPTY_BLOG_FORM)
    setEditingBlogId(null)
    setShowBlogForm(true)
  }

  const handleEditBlogPost = (post) => {
    setBlogForm({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      emoji: post.emoji,
      gradient: post.gradient,
      date: post.date,
      featured: post.featured,
      published: post.published,
      htmlContent: contentToHtml(post.content),
    })
    setEditingBlogId(post.id)
    setShowBlogForm(true)
  }

  const handleDeleteBlogPost = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return
    try {
      await deleteBlogPost(post.id)
      setBlogPosts((prev) => prev.filter((p) => p.id !== post.id))
      if (editingBlogId === post.id) resetBlogForm()
    } catch (err) {
      alert(err.message)
    }
  }

  const resetBpexchForm = () => {
    setBpexchForm(EMPTY_BPEXCH_USER_FORM)
    setShowBpexchForm(false)
  }

  const handleNewBpexchUser = () => {
    setBpexchForm(EMPTY_BPEXCH_USER_FORM)
    setShowBpexchForm(true)
  }

  const handleBpexchSubmit = async (e) => {
    e.preventDefault()
    setBpexchSaving(true)
    try {
      const saved = await createBpexchUser({
        username: bpexchForm.username.trim(),
        password: bpexchForm.password,
        userType: bpexchForm.userType,
        phone: bpexchForm.phone,
        reference: bpexchForm.reference,
        notes: bpexchForm.notes,
        isActive: bpexchForm.isActive,
      })
      setBpexchUsers((prev) => [saved, ...prev])
      resetBpexchForm()
    } catch (err) {
      alert(err.message)
    } finally {
      setBpexchSaving(false)
    }
  }

  const handleBlogSubmit = async (e) => {
    e.preventDefault()
    setBlogSaving(true)
    try {
      const payload = {
        title: blogForm.title,
        excerpt: blogForm.excerpt,
        category: blogForm.category,
        author: blogForm.author,
        emoji: blogForm.emoji,
        gradient: blogForm.gradient,
        date: blogForm.date,
        featured: blogForm.featured,
        published: blogForm.published,
        htmlContent: blogForm.htmlContent,
      }
      const saved = editingBlogId
        ? await updateBlogPost(editingBlogId, payload)
        : await createBlogPost(payload)
      setBlogPosts((prev) => {
        if (editingBlogId) {
          return prev.map((p) => (p.id === saved.id ? saved : p))
        }
        return [saved, ...prev]
      })
      resetBlogForm()
    } catch (err) {
      alert(err.message)
    } finally {
      setBlogSaving(false)
    }
  }

  const tabMeta = SIDEBAR_TABS.find((t) => t.id === activeTab)
  const TabIcon = tabMeta?.icon || LayoutDashboard

  return (
    <div className="flex h-dvh overflow-hidden bg-navy-dark">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id)
          if (id === 'deposit' || id === 'withdraw') {
            setMethodFilter('all')
            setDateFrom('')
            setDateTo('')
          }
        }}
        counts={sidebarCounts}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-60">
        <header className="shrink-0 border-b border-border bg-navy/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded border border-border p-2 text-muted hover:text-accent lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <TabIcon className="h-5 w-5 text-accent" />
                <div>
                  <h1 className="text-sm font-bold text-text sm:text-base">
                    {tabMeta?.label || 'Dashboard'}
                  </h1>
                  <p className="text-[10px] text-muted">
                    {activeTab === 'deposit'
                      ? 'All deposit requests from users'
                      : activeTab === 'withdraw'
                        ? 'All withdraw requests from users'
                        : activeTab === 'blog'
                          ? 'Create and manage blog articles'
                          : activeTab === 'accounts'
                            ? 'JazzCash / EasyPaisa / Bank details for the app'
                            : activeTab === 'whatsapp'
                              ? 'Country agents & WhatsApp numbers for register'
                              : activeTab === 'pnl'
                                ? 'Deposits, withdraws & expenses overview'
                                : activeTab === 'expenses'
                                  ? 'Track business expenses'
                                  : 'Auto-sync from BPEXCH or add users manually'}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {!isUsersTab && !isBlogTab && !isSettingsPanel && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={stats.total} icon={TabIcon} />
            <StatCard label="Pending" value={stats.pending} icon={Clock} accent={stats.pending > 0} />
            <StatCard label="Approved" value={stats.approved} icon={Check} accent />
            <StatCard
              label={`Approved ${activeTab === 'deposit' ? 'Deposits' : 'Withdraws'}`}
              value={formatCurrency(stats.approvedAmount)}
              icon={Wallet}
            />
          </div>
          )}

          {isAccountsTab && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Methods" value={paymentAccounts.length} icon={CreditCard} accent />
            <StatCard
              label="Wallets"
              value={paymentAccounts.filter((a) => a.id !== 'bank').length}
              icon={Wallet}
            />
            <StatCard
              label="Bank"
              value={paymentAccounts.some((a) => a.id === 'bank') ? 'ON' : '—'}
              icon={Wallet}
            />
          </div>
          )}

          {isWhatsappTab && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Countries" value={whatsappAgents.length} icon={MessageCircle} accent />
            <StatCard
              label="Active"
              value={whatsappAgents.filter((a) => a.isActive).length}
              icon={Check}
            />
            <StatCard
              label="Hidden"
              value={whatsappAgents.filter((a) => !a.isActive).length}
              icon={X}
            />
          </div>
          )}

          {isBlogTab && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total Posts" value={blogPosts.length} icon={FileText} accent />
            <StatCard
              label="Published"
              value={blogPosts.filter((p) => p.published).length}
              icon={Check}
            />
            <StatCard
              label="Featured"
              value={blogPosts.filter((p) => p.featured).length}
              icon={Eye}
            />
          </div>
          )}

          {isUsersTab && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Users" value={bpexchUsers.length} icon={Users} accent />
            <StatCard
              label="Bettors"
              value={bpexchUsers.filter((u) => u.userType === 'Bettor').length}
              icon={User}
            />
            <StatCard
              label="Admins"
              value={bpexchUsers.filter((u) => u.userType === 'Admin').length}
              icon={Shield}
            />
            <StatCard
              label="Agent"
              value={
                bpexchAgent?.username
                  ? bpexchAgent.username.length > 14
                    ? `${bpexchAgent.username.slice(0, 12)}…`
                    : bpexchAgent.username
                  : '—'
              }
              icon={Shield}
            />
          </div>
          )}

          <div className="mb-4 flex flex-col gap-3">
            {!isSettingsPanel && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isUsersTab
                    ? 'Search username, phone, type…'
                    : isBlogTab
                      ? 'Search blog title, excerpt, category…'
                      : 'Search by ID, name, phone, method, account…'
                }
                className="w-full rounded border border-border bg-navy-light py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            )}
            {!isUsersTab && !isBlogTab && !isSettingsPanel && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-border bg-navy-light px-3 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded border border-border bg-navy-light px-3 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="all">All Methods</option>
                {methodOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                From
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded border border-border bg-navy-light px-2 py-2 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                To
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded border border-border bg-navy-light px-2 py-2 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </label>
              {hasTxFilters && (
                <button
                  type="button"
                  onClick={clearTxFilters}
                  className="rounded border border-border px-3 py-2 text-xs font-semibold text-muted hover:border-accent/40 hover:text-accent transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
            )}
          </div>

          {loadError && (
            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {loadError}
            </div>
          )}

        {loading && (
          (isUsersTab && bpexchUsers.length === 0) ||
          (isBlogTab && blogPosts.length === 0) ||
          (isAccountsTab && paymentAccounts.length === 0) ||
          (isWhatsappTab && whatsappAgents.length === 0) ||
          (isExpensesTab && expenses.length === 0) ||
          (isPnlTab && !pnlSummary) ||
          (!isUsersTab && !isBlogTab && !isSettingsPanel && tabTransactions.length === 0)
        ) ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted">
              Loading{' '}
              {isUsersTab
                ? 'users'
                : isBlogTab
                  ? 'blog posts'
                  : isAccountsTab
                    ? 'payment accounts'
                    : isWhatsappTab
                      ? 'WhatsApp agents'
                      : isExpensesTab
                        ? 'expenses'
                        : isPnlTab
                          ? 'profit & loss'
                          : tabMeta?.label?.toLowerCase()}
              …
            </p>
          </div>
        ) : isPnlTab ? (
          <ProfitLossPanel
            summary={pnlSummary}
            dateFrom={financeDateFrom}
            dateTo={financeDateTo}
            onDateFrom={setFinanceDateFrom}
            onDateTo={setFinanceDateTo}
            onClear={() => {
              setFinanceDateFrom('')
              setFinanceDateTo('')
            }}
            loading={loading}
          />
        ) : isExpensesTab ? (
          <ExpensesPanel
            expenses={expenses}
            onCreate={handleCreateExpense}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
            creating={creatingExpense}
            savingId={savingExpenseId}
            deletingId={deletingExpenseId}
            dateFrom={financeDateFrom}
            dateTo={financeDateTo}
            onDateFrom={setFinanceDateFrom}
            onDateTo={setFinanceDateTo}
            onClearDates={() => {
              setFinanceDateFrom('')
              setFinanceDateTo('')
            }}
          />
        ) : isWhatsappTab ? (
          <WhatsappAgentsPanel
            agents={whatsappAgents}
            onSave={handleSaveWhatsappAgent}
            onCreate={handleCreateWhatsappAgent}
            onDelete={handleDeleteWhatsappAgent}
            savingCode={savingWhatsappCode}
            creating={creatingWhatsapp}
            deletingCode={deletingWhatsappCode}
          />
        ) : isAccountsTab ? (
          <PaymentAccountsPanel
            accounts={paymentAccounts}
            onSave={handleSavePaymentAccount}
            onCreate={handleCreatePaymentAccount}
            onDelete={handleDeletePaymentAccount}
            savingId={savingAccountId}
            creating={creatingAccount}
            deletingId={deletingAccountId}
          />
        ) : isBlogTab ? (
          <BlogPostsPanel
            posts={blogPosts}
            search={search}
            onEdit={handleEditBlogPost}
            onDelete={handleDeleteBlogPost}
            showForm={showBlogForm}
            form={blogForm}
            setForm={setBlogForm}
            onSubmit={handleBlogSubmit}
            onCancelForm={resetBlogForm}
            saving={blogSaving}
            editingId={editingBlogId}
            onNew={handleNewBlogPost}
          />
        ) : isUsersTab ? (
          <BpexchUsersPanel
            users={filteredUsers}
            search={search}
            showForm={showBpexchForm}
            form={bpexchForm}
            setForm={setBpexchForm}
            onSubmit={handleBpexchSubmit}
            onCancelForm={resetBpexchForm}
            saving={bpexchSaving}
            onNew={handleNewBpexchUser}
            onSyncUsers={handleSyncUsersFromBpexch}
            syncingUsers={syncingUsers}
            onSyncBalances={handleSyncBalances}
            syncingBalances={syncingBalances}
            agent={bpexchAgent}
            agentForm={bpexchAgentForm}
            setAgentForm={setBpexchAgentForm}
            onSaveAgent={handleSaveBpexchAgent}
            savingAgent={savingBpexchAgent}
          />
        ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <TabIcon className="mx-auto h-10 w-10 text-muted/40" />
              <p className="mt-3 text-sm text-muted">
                No {activeTab} requests found.
              </p>
              <p className="mt-1 text-xs text-muted/70">
                Requests appear here when users submit {activeTab} forms.
              </p>
            </div>
          ) : (
            <TransactionTable
              transactions={filtered}
              onSelect={setSelectedTx}
              onApprove={(id) => handleStatus(id, 'approved')}
              onReject={(id) => handleStatus(id, 'rejected')}
            />
          )}

        <p className="mt-6 text-center text-[10px] text-muted/60">
          {isUsersTab
            ? `Showing ${filteredUsers.length} of ${bpexchUsers.length} users${
                bpexchAgent?.username ? ` · agent ${bpexchAgent.username}` : ''
              }`
            : isBlogTab
              ? `Showing ${blogPosts.length} blog posts`
              : isAccountsTab
                ? `${paymentAccounts.length} payment methods (app deposit accounts)`
                : isWhatsappTab
                  ? `${whatsappAgents.length} WhatsApp agent countries`
                  : isExpensesTab
                    ? `${expenses.length} expenses`
                    : isPnlTab
                      ? 'Profit & loss from approved transactions + expenses'
                      : `Showing ${filtered.length} of ${tabTransactions.length} ${activeTab} requests`}
        </p>
        </main>
      </div>

      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          onApprove={(id, notes) => handleStatus(id, 'approved', notes)}
          onReject={(id, notes) => handleStatus(id, 'rejected', notes)}
        />
      )}
    </div>
  )
}

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('[admin]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-navy-dark px-4 text-center">
          <p className="text-sm font-semibold text-red-300">Admin panel crashed</p>
          <p className="max-w-md text-xs text-muted">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            type="button"
            className="rounded bg-accent px-4 py-2 text-xs font-bold text-navy-dark"
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset?.()
            }}
          >
            Back to login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => isAdminAuthenticated())

  const handleLogout = () => {
    logoutAdmin()
    setAuthed(false)
  }

  useEffect(() => {
    if (!authed) return undefined
    const onReject = (event) => {
      const msg = String(event?.reason?.message || event?.reason || '')
      if (/401|Authentication required|Invalid or expired token/i.test(msg)) {
        logoutAdmin()
        setAuthed(false)
      }
    }
    window.addEventListener('unhandledrejection', onReject)
    return () => window.removeEventListener('unhandledrejection', onReject)
  }, [authed])

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />
  }

  return (
    <AdminErrorBoundary onReset={handleLogout}>
      <AdminDashboard onLogout={handleLogout} />
    </AdminErrorBoundary>
  )
}
