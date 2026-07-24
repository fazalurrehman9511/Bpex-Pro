import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Copy,
  Check,
  Upload,
  Clock,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Image as ImageIcon,
  LayoutDashboard,
} from 'lucide-react'
import { useTransaction } from '../context/TransactionContext'
import {
  getPaymentMethodIds,
  getPaymentAccount,
  loadPaymentAccounts,
} from '../data/paymentAccounts'
import {
  getWithdrawMethod,
  getWithdrawMethodIds,
  loadWithdrawMethods,
} from '../data/withdrawMethods'
import { getPaymentMethod } from '../data/paymentMethods'
import {
  parseBalanceAmount,
  formatCurrency,
  getRemainingMs,
  formatRemaining,
  readScreenshotFile,
} from '../utils/transactions'
import { screenshotUrl } from '../utils/api'
import {
  getBpexchUsername,
  subscribeBpexchUsername,
} from '../utils/bpexchAuth'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'

const statusStyles = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  expired: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  approved: 'bg-accent/20 text-accent border-accent/40',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/40',
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

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded border border-border bg-navy-dark px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text break-all">{value}</p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded p-1.5 text-muted hover:bg-surface-hover hover:text-accent transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function TransactionHistoryTable({ transactions }) {
  if (!transactions.length) {
    return (
      <p className="rounded border border-dashed border-border py-8 text-center text-sm text-muted">
        No requests yet. Submit a deposit or withdraw request to see history here.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="bg-navy-dark text-muted">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Time</th>
            <th className="px-3 py-2.5 font-semibold">Type</th>
            <th className="px-3 py-2.5 font-semibold">Amount</th>
            <th className="px-3 py-2.5 font-semibold">Method</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Timer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => (
            <tr key={tx.id} className="bg-navy-light/50 hover:bg-surface-hover/30">
              <td className="px-3 py-2.5 text-muted whitespace-nowrap">
                {new Date(tx.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-3 py-2.5 capitalize text-text">{tx.type}</td>
              <td className="px-3 py-2.5 font-semibold text-text">
                {formatCurrency(tx.amount)}
              </td>
              <td className="px-3 py-2.5 text-muted">{tx.paymentMethodLabel}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[tx.status] || statusStyles.pending}`}
                >
                  {tx.status}
                </span>
              </td>
              <td className="px-3 py-2.5">
                {tx.status === 'pending' ? (
                  <Countdown expiresAt={tx.expiresAt} />
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TransactionPanel({
  type,
  availableBalance: availableBalanceProp,
  initialPaymentMethod = 'jazzcash',
  embedded = false,
}) {
  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }
  const { transactions, submitTransaction } = useTransaction()

  const [tab, setTab] = useState('form')
  const [methodId, setMethodId] = useState(initialPaymentMethod)
  const [amount, setAmount] = useState('')
  const [bpexchUsername, setBpexchUsernameState] = useState(() => getBpexchUsername())
  const [payoutTitle, setPayoutTitle] = useState('')
  const [payoutNumber, setPayoutNumber] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const [accountsTick, setAccountsTick] = useState(0)

  const isDeposit = type === 'deposit'
  const methodIds = isDeposit ? getPaymentMethodIds() : getWithdrawMethodIds()
  const account = isDeposit ? getPaymentAccount(methodId) : null
  const withdrawMethod = isDeposit ? null : getWithdrawMethod(methodId)
  const selectedMethodLabel = isDeposit
    ? account?.label || ''
    : withdrawMethod?.label || ''
  const methodMeta = isDeposit ? getPaymentMethod(methodId) : null
  void accountsTick

  const availableBalance = useMemo(
    () => parseBalanceAmount(availableBalanceProp),
    [availableBalanceProp]
  )

  const pendingCount = transactions.filter((t) => t.status === 'pending').length

  useEffect(() => {
    Promise.all([loadPaymentAccounts(), loadWithdrawMethods()]).then(() =>
      setAccountsTick((n) => n + 1),
    )
  }, [])

  useEffect(() => {
    return subscribeBpexchUsername((username) => {
      setBpexchUsernameState(String(username || '').trim())
    })
  }, [])

  useEffect(() => {
    document.title = isDeposit ? 'Deposit — BpxPro' : 'Withdraw — BpxPro'
    setTab('form')
    setAmount('')
    setBpexchUsernameState(getBpexchUsername())
    setPayoutTitle('')
    setPayoutNumber('')
    setScreenshot(null)
    setScreenshotPreview(null)
    setErrors({})
    setSuccessId(null)
    const nextIds = isDeposit ? getPaymentMethodIds() : getWithdrawMethodIds()
    setMethodId(nextIds.includes(initialPaymentMethod) ? initialPaymentMethod : nextIds[0] || '')
  }, [type, initialPaymentMethod, isDeposit, accountsTick])

  const validate = () => {
    const next = {}
    const num = parseFloat(amount)
    const username = (bpexchUsername || getBpexchUsername()).trim()

    if (!methodId) next.method = 'Select a payment method'
    if (!amount.trim() || Number.isNaN(num) || num <= 0) {
      next.amount = 'Enter a valid amount'
    }

    if (isDeposit) {
      const min = methodMeta?.minDeposit
        ? parseBalanceAmount(methodMeta.minDeposit) || 0
        : 0
      if (min > 0 && num < min) {
        next.amount = `Minimum deposit is ${methodMeta.minDeposit}`
      }
      if (!screenshot) next.screenshot = 'Payment screenshot is required'
    }

    if (!isDeposit) {
      if (availableBalance != null && num > availableBalance) {
        next.amount = `Amount cannot exceed available balance (${formatCurrency(availableBalance)})`
      }
      if (!payoutTitle.trim()) next.payoutTitle = 'Account title is required'
      if (!payoutNumber.trim()) next.payoutNumber = 'Account / wallet number is required'
    }

    if (!username) {
      next.form = 'Pehle BPEXCH login karo — username auto attach hota hai.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readScreenshotFile(file)
      setScreenshot(dataUrl)
      setScreenshotPreview(dataUrl)
      setErrors((prev) => ({ ...prev, screenshot: undefined }))
    } catch (err) {
      setErrors((prev) => ({ ...prev, screenshot: err.message }))
      setScreenshot(null)
      setScreenshotPreview(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const username = (bpexchUsername || getBpexchUsername()).trim()
    setSubmitting(true)
    try {
      const tx = await submitTransaction({
        type,
        amount: parseFloat(amount),
        paymentMethodId: methodId,
        paymentMethodLabel: selectedMethodLabel,
        accountTitle: isDeposit ? account.accountTitle : payoutTitle.trim(),
        accountNumber: isDeposit ? account.accountNumber : payoutNumber.trim(),
        bankName: isDeposit ? account.bankName : '',
        screenshot: isDeposit ? screenshot : null,
        payoutAccountTitle: isDeposit ? '' : payoutTitle.trim(),
        payoutAccountNumber: isDeposit ? '' : payoutNumber.trim(),
        name: username,
        availableBalance: availableBalanceProp ?? null,
      })
      setSuccessId(tx.id)
      setTab('history')
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || 'Failed to submit request' }))
    } finally {
      setSubmitting(false)
    }
  }

  const title = isDeposit ? 'Deposit Request' : 'Withdraw Request'
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine

  return (
    <div
      className={
        embedded
          ? 'dashboard-tx-theme'
          : 'rounded-lg border border-border bg-navy-light shadow-xl'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <h1 className="text-lg font-bold text-text">{title}</h1>
            <p className="text-[11px] text-muted">
              Submit request · Pending up to 30 minutes
              {pendingCount > 0 && (
                <span className="ml-1 text-amber-300">· {pendingCount} pending</span>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          onClick={openDashboard}
          className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent/40 hover:text-accent transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>

        <div className="flex gap-1 border-b border-border px-5">
          <button
            type="button"
            onClick={() => setTab('form')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'form'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'history'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            History
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/30 px-1.5 py-0.5 text-[10px] text-amber-200">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-5 py-4">
          {successId && tab === 'history' && (
            <div className="mb-4 rounded border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs text-accent">
              Request <strong>{successId}</strong> submitted — status is{' '}
              <strong>pending</strong>. Timer started (30 min).
            </div>
          )}

          {tab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isDeposit && availableBalance != null && (
                <div className="flex items-center gap-3 rounded border border-accent/30 bg-accent/5 px-4 py-3">
                  <Wallet className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      Available Balance
                    </p>
                    <p className="text-lg font-bold text-text">
                      {availableBalanceProp || formatCurrency(availableBalance)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Payment Method
                </label>
                <select
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  className="w-full rounded border border-border bg-navy-dark px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {methodIds.map((id) => {
                    const acc = isDeposit ? getPaymentAccount(id) : getWithdrawMethod(id)
                    return (
                      <option key={id} value={id}>
                        {acc.label}
                      </option>
                    )
                  })}
                </select>
                {errors.method && (
                  <p className="mt-1 text-xs text-red-400">{errors.method}</p>
                )}
              </div>

              {isDeposit ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text">Send payment to</p>
                  <CopyField label="Account Title" value={account.accountTitle} />
                  <CopyField label={account.bankName} value={account.accountNumber} />
                  {account.qrCodeImage ? (
                    <div className="rounded border border-border bg-navy-dark px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted">QR Code</p>
                      <img
                        src={account.qrCodeImage}
                        alt={`${account.label} QR code`}
                        className="mt-2 h-44 w-full rounded bg-white object-contain p-2"
                      />
                    </div>
                  ) : null}
                  <p className="text-[11px] text-muted">
                    Transfer the exact amount, then upload your payment screenshot below.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-text">Your payout details</p>
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={payoutTitle}
                      onChange={(e) => setPayoutTitle(e.target.value)}
                      placeholder="Name on JazzCash / EasyPaisa / Bank"
                      className="w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    {errors.payoutTitle && (
                      <p className="mt-1 text-xs text-red-400">{errors.payoutTitle}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5">
                      {selectedMethodLabel} Number / Bank Account
                    </label>
                    <input
                      type="text"
                      value={payoutNumber}
                      onChange={(e) => setPayoutNumber(e.target.value)}
                      placeholder="03XXXXXXXXX or IBAN"
                      className="w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    {errors.payoutNumber && (
                      <p className="mt-1 text-xs text-red-400">{errors.payoutNumber}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Amount {isDeposit ? '(Rs.)' : '(max available balance)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isDeposit ? 'e.g. 1000' : 'Enter amount to withdraw'}
                  className="w-full rounded border border-border bg-navy-dark px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-400">{errors.amount}</p>
                )}
              </div>

              {isDeposit && (
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Payment Screenshot
                  </label>
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-border bg-navy-dark px-4 py-5 hover:border-accent/40 transition-colors">
                    {screenshotPreview ? (
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="max-h-32 rounded object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted" />
                        <span className="text-xs text-muted">Tap to upload screenshot</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshot}
                      className="sr-only"
                    />
                  </label>
                  {errors.screenshot && (
                    <p className="mt-1 text-xs text-red-400">{errors.screenshot}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded bg-accent px-4 py-3.5 text-sm font-bold text-navy-dark hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>

              {errors.form && (
                <p className="text-center text-xs text-red-400">{errors.form}</p>
              )}

              <p className="text-center text-[11px] text-muted">
                Request stays <strong className="text-text">pending</strong> for 30 minutes while
                our agent reviews it.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <TransactionHistoryTable transactions={transactions} />

              {transactions.some((t) => t.screenshot) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Deposit screenshots (latest)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {transactions
                      .filter((t) => t.screenshot && t.type === 'deposit')
                      .slice(0, 3)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="rounded border border-border bg-navy-dark p-2"
                        >
                          <img
                            src={screenshotUrl(t.screenshot)}
                            alt={`${t.id} screenshot`}
                            className="h-16 w-auto rounded object-contain"
                          />
                          <p className="mt-1 text-[10px] text-muted">{t.id}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {transactions.length > 0 && (
                <details className="rounded border border-border bg-navy-dark px-3 py-2 text-xs">
                  <summary className="cursor-pointer font-semibold text-text">
                    Extra details
                  </summary>
                  <ul className="mt-2 space-y-2 text-muted">
                    {transactions.slice(0, 5).map((tx) => (
                      <li key={tx.id} className="border-t border-border pt-2 first:border-0 first:pt-0">
                        <p className="font-mono text-[10px] text-accent">{tx.id}</p>
                        <p>
                          {tx.type} · {formatCurrency(tx.amount)} · {tx.paymentMethodLabel}
                        </p>
                        {tx.type === 'deposit' && (
                          <p>
                            To: {tx.accountTitle} — {tx.accountNumber}
                          </p>
                        )}
                        {tx.type === 'withdraw' && (
                          <p>
                            Payout: {tx.payoutAccountTitle} — {tx.payoutAccountNumber}
                            {tx.availableBalance != null && (
                              <> · Balance was {tx.availableBalance}</>
                            )}
                          </p>
                        )}
                        <p>
                          {tx.name}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
    </div>
  )
}
