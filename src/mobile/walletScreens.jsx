import { useEffect, useState } from 'react'
import {
  Copy,
  User,
  Lock,
  Wallet,
  ArrowUpCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Phone,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Home,
  UserRound,
} from 'lucide-react'
import { BPEXCH_BASE_URL, BPEXCH_LOGIN_URL } from '../config/embed'
import { loadSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { openSupportWhatsApp } from '../utils/whatsapp'
import { PaymentMethodLogo } from './PaymentLogos'
import { BRAND_LOGO_MD, BRAND_LOGO_LG, BRAND_NAME } from '../config/brand'

function formatPkr(n) {
  return Number(n || 0).toLocaleString('en-PK')
}

function BpxLogo({ className = 'h-7 w-7' }) {
  return (
    <img
      src={BRAND_LOGO_MD}
      alt="BPX"
      className={`shrink-0 rounded-xl object-cover ${className}`}
      decoding="async"
    />
  )
}

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/** Fixed circular WhatsApp support button (bottom-right). */
export function WhatsAppFab({ username = '', className = '' }) {
  useEffect(() => {
    loadSupportWhatsAppNumber().catch(() => {})
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        const id = username && username !== 'your_id' ? username : ''
        openSupportWhatsApp(
          `Hi BpExch Support! 👋\n\nI need help${id ? ` (ID: ${id})` : ''}.\nPlease assist me.`,
        )
      }}
      className={`fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-4 z-[120] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 active:scale-95 ${className}`}
      aria-label="WhatsApp Support"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </button>
  )
}

/** Bottom footer: Home + Profile */
export function WalletBottomNav({ active = 'home', onHome, onProfile }) {
  const item = (id, label, Icon, onClick) => {
    const selected = active === id
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 active:opacity-80 ${
          selected ? 'text-accent' : 'text-white/55'
        }`}
      >
        <Icon className={`h-5 w-5 ${selected ? 'text-accent' : ''}`} />
        <span className="text-[10px] font-bold">{label}</span>
      </button>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[115] border-t border-white/10 bg-[#062a1c]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-stretch">
        {item('home', 'Home', Home, onHome)}
        {item('profile', 'Profile', UserRound, onProfile)}
      </div>
    </nav>
  )
}

export function ScreenProfile({
  username = '',
  passwordText = '—',
  balance = null,
  balanceLoading = false,
  onCopyUsername,
  onCopyPassword,
  onLogout,
  onOpenBetting,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  const balanceLabel =
    balanceLoading && balance == null
      ? '…'
      : balance == null
        ? '—'
        : `PKR ${Number(balance).toLocaleString('en-PK')}`

  return (
    <div
      className={`flex ${shell} flex-col overflow-y-auto bg-gradient-to-b from-[#063822] to-[#0a4d2e] px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]`}
    >
      <div className="mb-5 flex items-center gap-3">
        <BpxLogo className="h-14 w-14" />
        <div>
          <p className="text-lg font-black text-white">Profile</p>
          <p className="text-[11px] text-white/55">BpExch account details</p>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-accent/30 bg-[#0a3d28]/90 px-3 py-3">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
          BPEXCH Balance
        </p>
        <p className="mt-0.5 text-2xl font-black text-accent">{balanceLabel}</p>
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-[#0a3d28]/90 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-white/50">Username</p>
            <p className="text-xs font-semibold text-white">{username || '—'}</p>
          </div>
          <button type="button" onClick={onCopyUsername} aria-label="Copy username">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-white/50">Password</p>
            <p className="text-xs font-semibold text-white">{passwordText || '—'}</p>
          </div>
          <button type="button" onClick={onCopyPassword} aria-label="Copy password">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenBetting}
        className="mb-3 w-full rounded-xl border border-accent/40 bg-accent/10 py-3 text-sm font-bold text-accent active:opacity-90"
      >
        Open BPEXCH
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/20 py-3 text-sm font-bold text-white active:opacity-80"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  )
}

export function ScreenLogin({
  username,
  password,
  onUsername,
  onPassword,
  onLogin,
  onRegister,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  return (
    <div
      className={`flex ${shell} flex-col items-center justify-center bg-gradient-to-b from-[#0a2a18] via-[#0f5c32] to-[#25D366] px-8 pb-10 pt-[max(3.5rem,env(safe-area-inset-top))]`}
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        <img
          src={BRAND_LOGO_LG}
          alt="BPX"
          width={112}
          height={112}
          className="h-28 w-28 rounded-[28px] object-cover shadow-lg shadow-black/30"
          decoding="async"
        />
        <p className="mt-4 text-center text-xl font-black text-white">{BRAND_NAME}</p>

        <div className="mt-12 w-full space-y-6">
          <label className="flex w-full items-center justify-center gap-3 border-b border-white/40 pb-2">
            <User className="h-5 w-5 shrink-0 text-white/90" />
            <input
              value={username}
              onChange={(e) => onUsername?.(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className="w-full bg-transparent text-center text-sm text-white placeholder:text-white/50 outline-none"
            />
          </label>
          <label className="flex w-full items-center justify-center gap-3 border-b border-white/40 pb-2">
            <Lock className="h-5 w-5 shrink-0 text-white/90" />
            <input
              type="password"
              value={password}
              onChange={(e) => onPassword?.(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-transparent text-center text-sm text-white placeholder:text-white/50 outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="mt-14 w-full rounded-full bg-white py-3.5 text-center text-sm font-bold text-slate-700 shadow-lg active:scale-[0.99]"
        >
          Login
        </button>

        <p className="mt-6 text-center text-sm text-white/80">
          New user?{' '}
          <button
            type="button"
            onClick={onRegister}
            className="font-bold text-white underline underline-offset-2 active:opacity-80"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

const regInputClass =
  'w-full rounded-lg border border-white/15 bg-[#0a3d28]/80 px-3.5 py-3 text-sm text-white placeholder:text-white/45 outline-none focus:border-accent/50'

export function ScreenRegister({
  password = '',
  confirmPassword = '',
  name = '',
  phone = '',
  dialCode = '+92',
  showPass = false,
  submitting = false,
  error = '',
  created = null,
  onPassword,
  onConfirmPassword,
  onName,
  onPhone,
  onToggleShowPass,
  onSubmit,
  onBack,
  onGoLogin,
  onCopyCreds,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'

  if (created) {
    return (
      <div
        className={`flex ${shell} flex-col bg-gradient-to-b from-[#063822] to-[#0a4d2e] px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]`}
      >
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-4 text-center">
            <p className="text-sm font-bold text-accent">Account created</p>
            <p className="mt-1 text-[11px] text-white/60">Apna username save kar lo</p>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-[#0a3d28]/90 px-4 py-3.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50">Username (auto)</p>
              <p className="text-base font-bold text-white">{created.username}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50">Password</p>
              <p className="text-base font-bold text-white">{created.password}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onCopyCreds}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 px-3 py-3 text-xs font-semibold text-white active:opacity-80"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={onGoLogin}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-3 text-xs font-bold text-navy-dark active:opacity-90"
            >
              Login now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex ${shell} flex-col overflow-y-auto bg-gradient-to-b from-[#063822] to-[#0a4d2e] px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]`}
    >
      <div className="mx-auto w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 active:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>

        <div className="mb-5 flex items-center gap-3">
          <BpxLogo className="h-12 w-12" />
          <div>
            <p className="text-lg font-black text-white">Create Account</p>
            <p className="text-[11px] text-white/55">Username system auto generate karega</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/80">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPassword?.(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                autoComplete="new-password"
                className={`${regInputClass} pr-11`}
              />
              <button
                type="button"
                onClick={onToggleShowPass}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/50 active:text-white"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/80">
              Confirm Password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => onConfirmPassword?.(e.target.value)}
              placeholder="Re-enter password"
              minLength={8}
              autoComplete="new-password"
              className={regInputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/80">
              Full Name <span className="font-normal text-white/45">(optional)</span>
            </label>
            <input
              value={name}
              onChange={(e) => onName?.(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className={regInputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/80">Phone Number</label>
            <div className="flex gap-2">
              <span className="flex shrink-0 items-center rounded-lg border border-white/15 bg-[#0a3d28]/80 px-3 text-sm text-white/70">
                {dialCode}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => onPhone?.(e.target.value)}
                placeholder="300 1234567"
                autoComplete="tel"
                className={regInputClass}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-navy-dark active:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ScreenWallet({
  username = 'your_id',
  passwordMask = '••••••••',
  balance = null,
  balanceLoading = false,
  notifications = [],
  transactions = [],
  onCopyUsername,
  onCopyPassword,
  onDeposit,
  onWithdraw,
  onOpenBetting,
  onRefresh,
  onLogout,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  const latestNotice = notifications[0]
  const balanceLabel =
    balanceLoading && balance == null
      ? '…'
      : balance == null
        ? '—'
        : `PKR ${Number(balance).toLocaleString('en-PK')}`

  return (
    <div
      className={`flex ${shell} flex-col overflow-hidden bg-gradient-to-b from-[#063822] to-[#0a4d2e] px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]`}
    >
      <div className="shrink-0">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BpxLogo className="h-8 w-8" />
            <p className="truncate text-sm font-bold text-white">{BRAND_NAME} Wallet</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-black/20 px-2.5 py-1.5 text-[10px] font-bold text-white active:opacity-80"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>

      <button
        type="button"
        onClick={onRefresh}
        className="mb-2 w-full rounded-xl border border-accent/30 bg-[#0a3d28]/90 px-3 py-3 text-left active:opacity-90"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
            BPEXCH Balance
          </p>
          <span className="inline-flex items-center gap-1 text-[8px] font-bold text-accent/80">
            <RefreshCw className={`h-3 w-3 ${balanceLoading ? 'animate-spin' : ''}`} />
            Tap refresh
          </span>
        </div>
        <p className="mt-0.5 text-2xl font-black text-accent">{balanceLabel}</p>
      </button>

      <div className="mb-2 rounded-xl border border-white/10 bg-[#0a3d28]/90 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-white/50">Username</p>
            <p className="text-xs font-semibold text-white">{username || 'your_id'}</p>
          </div>
          <button type="button" onClick={onCopyUsername} aria-label="Copy username">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-white/50">Password</p>
            <p className="text-xs font-semibold text-white">{passwordMask}</p>
          </div>
          <button type="button" onClick={onCopyPassword} aria-label="Copy password">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>

      {latestNotice ? (
        <div className="mb-3 overflow-hidden rounded-md bg-[#0d5c38] px-2 py-1.5">
          <p className="truncate text-[9px] text-accent">
            {typeof latestNotice === 'string' ? latestNotice : latestNotice.text}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onOpenBetting}
        className="mb-4 flex w-full items-center gap-4 rounded-2xl border-2 border-accent/50 bg-gradient-to-r from-[#062a1c] via-[#0a4d2e] to-[#0d5c38] px-4 py-5 text-left shadow-lg shadow-black/25 active:scale-[0.99]"
      >
        <BpxLogo className="h-16 w-16 ring-2 ring-accent/40" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-black tracking-tight text-white">{BRAND_NAME} ID Login</p>
          <p className="mt-1 text-[11px] leading-snug text-white/70">
            Open BPEXCH betting — same ID, auto sign-in
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-black uppercase tracking-wide text-navy-dark">
              TAP TO OPEN
            </span>
            <span className="text-[11px] font-bold text-accent">In-app →</span>
          </div>
        </div>
      </button>

      <p className="mb-1.5 text-[10px] font-bold text-white">Quick Actions</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDeposit}
          className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-br from-accent to-emerald-600 py-3 active:opacity-90"
        >
          <Wallet className="h-5 w-5 text-navy-dark" />
          <span className="text-[10px] font-bold text-navy-dark">Deposit</span>
        </button>
        <button
          type="button"
          onClick={onWithdraw}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-[#0a3d28] py-3 active:opacity-90"
        >
          <ArrowUpCircle className="h-5 w-5 text-white" />
          <span className="text-[10px] font-bold text-white">Withdrawal</span>
        </button>
      </div>
      </div>

      <div className="mt-1 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-[10px] font-bold text-white">Recent Transactions</p>
          <button
            type="button"
            onClick={onRefresh}
            className="text-[8px] font-bold uppercase tracking-wide text-accent/90"
          >
            Refresh
          </button>
        </div>
        <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-1.5 pb-1">
        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 bg-black/15 px-3 py-6 text-center">
            <p className="text-[11px] font-semibold text-white/80">No transactions</p>
            <p className="mt-1 text-[9px] text-white/45">Deposit ya withdraw ke baad yahan dikhega</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-800">{tx.title}</p>
                <p className="text-[8px] text-slate-400">{tx.meta}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-[10px] font-bold ${
                    tx.kind === 'deposit' ? 'text-emerald-600' : 'text-orange-500'
                  }`}
                >
                  {tx.amountLabel}
                </p>
                <span
                  className={`rounded px-1.5 py-0.5 text-[7px] font-bold ${
                    tx.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : tx.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-700'
                        : tx.status === 'EXPIRED'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tx.status === 'APPROVED'
                    ? 'APPROVED'
                    : tx.status === 'REJECTED'
                      ? 'REJECTED'
                      : tx.status === 'EXPIRED'
                        ? 'EXPIRED'
                        : 'PENDING'}
                </span>
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScreenDeposit({
  amount = '',
  onAmountChange,
  onNext,
  onBack,
  preview = false,
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'X']
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  const display = formatPkr(amount || 0)

  const press = (k) => {
    if (!onAmountChange) return
    if (k === 'X') {
      onAmountChange(String(amount || '').slice(0, -1))
      return
    }
    const next = `${amount || ''}${k}`.replace(/^0+(?=\d)/, '')
    if (next.length > 8) return
    onAmountChange(next)
  }

  return (
    <div className={`flex ${shell} flex-col bg-slate-100`}>
      <div className="bg-orange-500 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-lg bg-black/15 px-2.5 py-1.5 text-xs font-bold text-white active:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-sm font-bold text-white">Deposit</p>
        </div>
        <p className="text-[13px] leading-relaxed text-white">
          Dear Guest User, to deposit into your BpExch account, enter the amount and tap Next.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/95" dir="rtl">
          مطلوبہ رقم درج کریں اور Next پر کلک کریں۔
        </p>
      </div>

      <div className="mx-4 mt-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-6 text-center text-white shadow-md">
        <p className="text-sm font-medium">Enter Amount</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">PKR {display || '0'}</p>
        <p className="mt-2 text-xs text-white/90">Minimum amount is PKR 1,000</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 px-5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={`flex h-12 items-center justify-center rounded-xl text-base font-bold shadow-sm active:opacity-80 ${
              k === 'X'
                ? 'bg-rose-100 text-rose-600'
                : k === '0'
                  ? 'col-span-2 bg-white text-slate-800'
                  : 'bg-white text-slate-800'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-xl bg-accent py-3.5 text-center text-base font-bold text-navy-dark active:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function ScreenMethod({
  amount = '0',
  method = 'easypaisa',
  methodOpen = false,
  accountTitle = 'BpExch Agent',
  accountNumber = '03001234567',
  qrCodeImage = '',
  onToggleMethods,
  onSelectMethod,
  onCopyName,
  onCopyNumber,
  onPrevious,
  onNext,
  preview = false,
}) {
  const methods = [
    { id: 'easypaisa', name: 'EasyPaisa' },
    { id: 'jazzcash', name: 'JazzCash' },
    { id: 'bank', name: 'Bank Transfer' },
  ]
  const selected = methods.find((m) => m.id === method) || methods[0]
  const bonus = Math.floor(Number(amount || 0) * 0.1)
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'

  return (
    <div className={`relative flex ${shell} flex-col bg-white pt-[max(2.5rem,env(safe-area-inset-top))]`}>
      <div className="mx-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">Amount to Deposit:</span>
        <span className="text-base font-extrabold text-accent">PKR {formatPkr(amount)}</span>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-accent">
        You will receive bonus: PKR {formatPkr(bonus)}
      </p>

      <button
        type="button"
        onClick={onToggleMethods}
        className="mx-4 mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3.5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <PaymentMethodLogo id={selected.id} className="h-10 w-10" />
          <span className="text-base font-semibold text-slate-800">{selected.name}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-accent" />
      </button>

      {/* Account details — same as sample after method select */}
      {!methodOpen && (
        <div className="mx-4 mt-5 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-base font-bold text-slate-900">Account Details</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-accent">Name:</span>{' '}
                <span className="font-medium text-slate-800">{accountTitle}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onCopyName}
              className="shrink-0 rounded-lg p-2 active:bg-slate-100"
              aria-label="Copy account name"
            >
              <Copy className="h-5 w-5 text-accent" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-accent">Number:</span>{' '}
                <span className="font-medium text-slate-800">{accountNumber}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onCopyNumber}
              className="shrink-0 rounded-lg p-2 active:bg-slate-100"
              aria-label="Copy account number"
            >
              <Copy className="h-5 w-5 text-accent" />
            </button>
          </div>

          {qrCodeImage ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-700">Scan QR Code</p>
              <img
                src={qrCodeImage}
                alt={`${selected.name} QR code`}
                className="mt-2 h-44 w-full rounded-lg bg-white object-contain p-2"
              />
            </div>
          ) : null}

          <p className="mt-4 text-[11px] leading-relaxed text-rose-500">
            Please submit your deposit on mentioned account no &amp; submit receipt on next step
          </p>
        </div>
      )}

      {methodOpen && (
        <div className="absolute inset-x-4 top-[42%] z-20 -translate-y-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <p className="border-b border-slate-100 px-4 py-3 text-base font-bold text-slate-800">
            Select Deposit Method
          </p>
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMethod?.(m.id)}
              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3.5 last:border-0 active:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <PaymentMethodLogo id={m.id} className="h-10 w-10" />
                <span className="text-base font-medium text-slate-800">{m.name}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleMethods}
            className="w-full py-3 text-center text-sm font-semibold text-rose-500"
          >
            Cancel
          </button>
        </div>
      )}
      {methodOpen && (
        <button
          type="button"
          aria-label="Close method picker"
          className="absolute inset-0 z-10 bg-black/25"
          onClick={onToggleMethods}
        />
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-xl bg-slate-400 py-3.5 text-center text-sm font-bold text-white"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-navy-dark"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function ScreenProof({
  amount = '0',
  methodLabel = 'EasyPaisa',
  accountTitle = 'BpExch Agent',
  accountNumber = '0300 1234567',
  qrCodeImage = '',
  screenshotPreview,
  onScreenshotChange,
  submitting = false,
  onPrevious,
  onSubmit,
  onCopyName,
  onCopyNumber,
  preview = false,
}) {
  const bonus = Math.floor(Number(amount || 0) * 0.1)
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'

  return (
    <div
      className={`flex ${shell} flex-col bg-white px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]`}
    >
      <div className="rounded-xl border border-slate-200 px-3 py-3">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-accent">PKR {formatPkr(amount)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[11px]">
          <span className="text-slate-500">Bonus you will receive</span>
          <span className="font-bold text-accent">PKR {formatPkr(bonus)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-[11px]">
          <span className="text-slate-500">Payment Method</span>
          <span className="font-bold text-accent">{methodLabel}</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-800">Upload Payment Proof</p>
      <label className="mt-2 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 px-3 py-6">
        {screenshotPreview ? (
          <img
            src={screenshotPreview}
            alt="Payment proof"
            className="h-28 max-w-full rounded-lg object-contain"
          />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-accent" />
            <p className="mt-2 text-[11px] font-semibold text-accent">Tap to upload screenshot</p>
            <div className="mt-3 h-16 w-24 rounded-lg bg-gradient-to-br from-emerald-100 to-slate-200" />
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onScreenshotChange?.(e.target.files?.[0] || null)}
        />
      </label>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-xs font-bold text-slate-800">Account Details</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-slate-400">Name</p>
            <p className="text-xs font-semibold text-slate-700">{accountTitle}</p>
          </div>
          <button type="button" onClick={onCopyName} aria-label="Copy name">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-slate-400">Number</p>
            <p className="text-xs font-semibold text-slate-700">{accountNumber}</p>
          </div>
          <button type="button" onClick={onCopyNumber} aria-label="Copy number">
            <Copy className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
        {qrCodeImage ? (
          <div className="mt-3">
            <p className="text-[9px] text-slate-400">QR Code</p>
            <img
              src={qrCodeImage}
              alt={`${methodLabel} QR code`}
              className="mt-1 h-40 w-full rounded-lg border border-slate-200 bg-white object-contain p-2"
            />
          </div>
        ) : null}
        <p className="mt-2 text-[9px] leading-snug text-rose-500">
          Please submit deposit on mentioned account &amp; upload receipt
        </p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={submitting}
          className="rounded-xl bg-slate-400 py-3 text-center text-xs font-bold text-white disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-xl bg-accent py-3 text-center text-xs font-bold text-navy-dark disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

export function ScreenWithdraw({
  method = 'easypaisa',
  methods = [
    { id: 'easypaisa', label: 'EasyPaisa' },
    { id: 'jazzcash', label: 'JazzCash' },
    { id: 'bank', label: 'Bank Transfer' },
  ],
  onSelectMethod,
  amount,
  holder,
  mobile,
  balance = null,
  balanceLoading = false,
  canWithdraw = false,
  minBalanceForWithdraw = 500,
  onAmount,
  onHolder,
  onMobile,
  onBack,
  onSubmit,
  submitting = false,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  const blocked = !balanceLoading && balance != null && !canWithdraw
  const amtNum = Number(amount || 0)
  const overBalance = balance != null && amtNum > 0 && amtNum > balance
  const underMin = amtNum > 0 && amtNum < 500
  const balanceText =
    balanceLoading && balance == null
      ? 'Loading…'
      : balance == null
        ? '—'
        : `PKR ${Number(balance).toLocaleString('en-PK')}`

  return (
    <div className={`flex ${shell} flex-col bg-white`}>
      <div className="flex items-center gap-2 bg-accent px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4 text-navy-dark" />
        </button>
        <p className="text-sm font-bold text-navy-dark">WITHDRAW FUNDS</p>
      </div>
      <div className="px-4 pt-4">
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Available Balance</p>
          <p className="text-lg font-bold text-accent">{balanceText}</p>
          {blocked ? (
            <p className="mt-1 text-[11px] font-medium text-red-600">
              Balance PKR {minBalanceForWithdraw} ya us se kam hai — withdraw band hai
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500">
              Min PKR 500 · amount balance se zyada nahi ho sakti
            </p>
          )}
        </div>

        <p className="text-sm font-bold text-accent">Choose Payment Method</p>
        <div className="mt-3 space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMethod?.(m.id)}
              disabled={blocked}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left disabled:opacity-50"
            >
              <span
                className={`h-4 w-4 rounded-full border-2 ${
                  method === m.id ? 'border-accent bg-accent' : 'border-slate-300'
                }`}
              />
              <PaymentMethodLogo id={m.id} className="h-8 w-8" />
              <span className="text-sm font-medium text-slate-800">{m.label || m.name || m.id}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-bold text-accent">Receiving Account Details</p>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700">
            <span className="font-bold text-accent">Rs</span>
            <input
              value={amount || ''}
              onChange={(e) => onAmount?.(e.target.value.replace(/\D/g, ''))}
              placeholder="Amount (Min PKR 500)"
              inputMode="numeric"
              disabled={blocked}
              className="w-full bg-transparent outline-none placeholder:text-slate-400 disabled:opacity-50"
            />
          </label>
          {overBalance ? (
            <p className="text-[11px] font-medium text-red-600">
              Amount balance se zyada nahi (max PKR {Number(balance).toLocaleString('en-PK')})
            </p>
          ) : null}
          {underMin && !overBalance ? (
            <p className="text-[11px] font-medium text-amber-600">Minimum withdraw PKR 500</p>
          ) : null}
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={holder || ''}
              onChange={(e) => onHolder?.(e.target.value)}
              placeholder="Account Holder Name"
              disabled={blocked}
              className="w-full bg-transparent outline-none placeholder:text-slate-400 disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={mobile || ''}
              onChange={(e) => onMobile?.(e.target.value.replace(/\D/g, ''))}
              placeholder="Wallet / Account Number"
              inputMode="tel"
              disabled={blocked}
              className="w-full bg-transparent outline-none placeholder:text-slate-400 disabled:opacity-50"
            />
          </label>
        </div>
      </div>
      <div className="mt-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || blocked || balanceLoading || overBalance || underMin}
          className="w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-navy-dark disabled:opacity-60"
        >
          {submitting
            ? 'Submitting…'
            : blocked
              ? 'Withdraw Unavailable'
              : overBalance
                ? 'Amount too high'
                : 'Submit Withdrawal'}
        </button>
      </div>
    </div>
  )
}

/** In-app BPEXCH — auto sign-in with wallet credentials (no second login). */
export function ScreenBetting({
  username = '',
  password = '',
  onBack,
  preview = false,
}) {
  const shell = preview ? 'min-h-[520px]' : 'min-h-dvh'
  const [status, setStatus] = useState('Signing in to BPEXCH…')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (preview) return undefined
    let cancelled = false

    ;(async () => {
      try {
        setFailed(false)
        setStatus('Signing in with your BpExch ID…')
        const { openBpexchWithAppLogin } = await import('./bpexchAutoLogin')
        await openBpexchWithAppLogin({ username, password })
        if (!cancelled) setStatus('Opening BPEXCH…')
      } catch (err) {
        if (cancelled) return
        setFailed(true)
        setStatus(err.message || 'Could not open BPEXCH')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [username, password, preview])

  return (
    <div className={`flex ${shell} flex-col bg-navy-dark pb-[calc(5.5rem+env(safe-area-inset-bottom))]`}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#062a1c] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </button>
        <p className="text-sm font-bold text-white">BPEXCH</p>
      </div>
      {preview ? (
        <div className="flex flex-1 items-center justify-center bg-slate-100 px-4 text-center text-xs text-slate-500">
          BPEXCH opens here with auto sign-in
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          {!failed ? (
            <RefreshCw className="h-8 w-8 animate-spin text-accent" />
          ) : null}
          <p className="text-sm font-semibold text-white">{status}</p>
          {failed ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-white/55">
                Phone aur Mac same Wi‑Fi pe hon, phir dubara try karo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false)
                  setStatus('Retrying…')
                  import('./bpexchAutoLogin').then(({ openBpexchWithAppLogin }) =>
                    openBpexchWithAppLogin({ username, password }).catch((err) => {
                      setFailed(true)
                      setStatus(err.message || 'Could not open BPEXCH')
                    }),
                  )
                }}
                className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-navy-dark"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  import('../utils/api')
                    .then(({ verifyBpexchUser }) =>
                      verifyBpexchUser({ username, password }).then(() => {
                        window.location.href = BPEXCH_LOGIN_URL
                      }),
                    )
                    .catch((err) => {
                      setFailed(true)
                      setStatus(err.message || 'Account verify nahi hua')
                    })
                }}
                className="block w-full text-xs font-semibold text-accent"
              >
                Open login page (verified users only)
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/50">Same username &amp; password — no second login</p>
          )}
        </div>
      )}
    </div>
  )
}

export const PREVIEW_SCREENS = [
  { id: 'login', label: 'Login' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'method', label: 'Method' },
  { id: 'proof', label: 'Proof' },
  { id: 'withdraw', label: 'Withdraw' },
]
