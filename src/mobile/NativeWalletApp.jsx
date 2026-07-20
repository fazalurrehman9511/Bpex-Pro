import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { getPaymentAccount, loadPaymentAccounts } from '../data/paymentAccounts'
import {
  createTransaction,
  setUserPhone,
  fetchBpexchBalance,
  fetchUserTransactions,
  selfRegister,
  verifyBpexchUser,
} from '../utils/api'
import { readScreenshotFile } from '../utils/transactions'
import {
  ScreenLogin,
  ScreenRegister,
  ScreenWallet,
  ScreenProfile,
  ScreenDeposit,
  ScreenMethod,
  ScreenProof,
  ScreenWithdraw,
  ScreenBetting,
  WalletBottomNav,
  WhatsAppFab,
} from './walletScreens'

const STORAGE_KEY = 'flowexch.wallet.session'
const TX_KEY = 'flowexch.wallet.transactions'
const NOTICE_KEY = 'flowexch.wallet.notifications'
const PHONE_KEY = 'flowexch.wallet.phone'
const NOTICE_TTL_MS = 12_000
const SYNC_MS = 8_000

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

async function copyText(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}

function formatPkr(n) {
  return Number(n || 0).toLocaleString('en-PK')
}

function todayLabel(iso) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function mapServerTx(tx) {
  const isDeposit = tx.type === 'deposit'
  return {
    id: tx.id,
    kind: isDeposit ? 'deposit' : 'withdraw',
    title: isDeposit ? 'Deposit' : 'Withdrawal',
    meta: `${todayLabel(tx.createdAt)} · ${tx.paymentMethodLabel || ''}`,
    amountLabel: `${isDeposit ? '+' : '-'}${formatPkr(tx.amount)}`,
    status: String(tx.status || 'pending').toUpperCase(),
  }
}

function loadActiveNotices() {
  const raw = loadJson(NOTICE_KEY, [])
  const now = Date.now()
  return raw
    .map((n) => (typeof n === 'string' ? null : n))
    .filter((n) => n && n.text && n.at && now - n.at < NOTICE_TTL_MS)
}

/**
 * Full-screen FlowExch Wallet — only the mockup screens (not the marketing website).
 */
export default function NativeWalletApp() {
  const existing = loadJson(STORAGE_KEY, null)
  const tabFromUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tab')
      : null
  const initialScreen = existing?.username
    ? tabFromUrl === 'profile'
      ? 'profile'
      : 'wallet'
    : 'login'
  const [screen, setScreen] = useState(initialScreen)
  const [username, setUsername] = useState(existing?.username || '')
  const [password, setPassword] = useState(existing?.password || '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('easypaisa')
  const [methodOpen, setMethodOpen] = useState(true)
  const [withdrawMethod, setWithdrawMethod] = useState('easypaisa')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [holder, setHolder] = useState('')
  const [mobile, setMobile] = useState('')
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) || '')
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [screenshotData, setScreenshotData] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState(() => loadJson(TX_KEY, []))
  const [notifications, setNotifications] = useState(() => loadActiveNotices())
  const [toast, setToast] = useState('')
  const [accountsReady, setAccountsReady] = useState(0)
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [minBalanceForWithdraw, setMinBalanceForWithdraw] = useState(500)
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regShowPass, setRegShowPass] = useState(false)
  const [regSubmitting, setRegSubmitting] = useState(false)
  const [regError, setRegError] = useState('')
  const [regCreated, setRegCreated] = useState(null)
  const statusMapRef = useRef({})
  const noticeTimersRef = useRef(new Map())

  const flash = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    loadPaymentAccounts().then(() => setAccountsReady((n) => n + 1))
  }, [])

  useEffect(() => {
    const session = loadJson(STORAGE_KEY, null)
    if (!session?.username) return
    let cancelled = false
    verifyBpexchUser({
      username: session.username,
      password: session.password || undefined,
    }).catch((err) => {
      if (cancelled) return
      clearSession()
      setUsername('')
      setPassword('')
      setScreen('login')
      flash(err.message || 'Session invalid — dubara login karein')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onNav = (e) => {
      const tab = e?.detail || new URLSearchParams(window.location.search).get('tab')
      if (!loadJson(STORAGE_KEY, null)?.username) {
        setScreen('login')
        return
      }
      if (tab === 'profile') setScreen('profile')
      else if (tab === 'home' || tab === 'wallet') setScreen('wallet')
    }
    window.addEventListener('bpexch-nav', onNav)
    const onPop = () => onNav({ detail: new URLSearchParams(window.location.search).get('tab') })
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('bpexch-nav', onNav)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  const showChrome = ['wallet', 'profile', 'betting', 'deposit', 'method', 'proof', 'withdraw'].includes(
    screen,
  )
  /** Show React footer on app screens (native BPEXCH uses Android overlay). */
  const useReactChrome = showChrome

  const goHome = () => setScreen('wallet')
  const goProfile = () => setScreen('profile')

  const chrome = useReactChrome ? (
    <>
      <WalletBottomNav
        active={screen === 'profile' ? 'profile' : 'home'}
        onHome={goHome}
        onProfile={goProfile}
      />
      <WhatsAppFab username={username} />
    </>
  ) : null

  useEffect(() => {
    const timers = noticeTimersRef.current
    notifications.forEach((n) => {
      if (!n?.id || timers.has(n.id)) return
      const left = NOTICE_TTL_MS - (Date.now() - (n.at || 0))
      const ms = Math.max(500, left)
      const t = window.setTimeout(() => {
        setNotifications((prev) => {
          const next = prev.filter((x) => x.id !== n.id)
          saveJson(NOTICE_KEY, next)
          return next
        })
        timers.delete(n.id)
      }, ms)
      timers.set(n.id, t)
    })
    return () => {
      /* keep timers across re-renders; clear only on unmount */
    }
  }, [notifications])

  useEffect(() => {
    const timers = noticeTimersRef.current
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      timers.clear()
    }
  }, [])

  const refreshBalance = async (user = username, { quiet } = {}) => {
    const u = String(user || '').trim()
    if (!u) return null
    setBalanceLoading(true)
    try {
      const data = await fetchBpexchBalance(u)
      const nextBalance = data.balance == null ? null : Number(data.balance)
      setBalance(nextBalance)
      setCanWithdraw(Boolean(data.canWithdraw))
      if (data.minBalanceForWithdraw != null) {
        setMinBalanceForWithdraw(Number(data.minBalanceForWithdraw))
      }
      return data
    } catch (err) {
      setBalance(null)
      setCanWithdraw(false)
      if (!quiet) flash(err.message || 'Balance load nahi hua')
      return null
    } finally {
      setBalanceLoading(false)
    }
  }

  const pushNotice = (text) => {
    const notice = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, at: Date.now() }
    setNotifications((prev) => {
      const next = [notice, ...prev].slice(0, 10)
      saveJson(NOTICE_KEY, next)
      return next
    })
  }

  const pushTx = (tx) => {
    setTransactions((prev) => {
      const next = [tx, ...prev.filter((t) => t.id !== tx.id)].slice(0, 30)
      saveJson(TX_KEY, next)
      return next
    })
  }

  const syncTransactions = async (user = username) => {
    const u = String(user || '').trim()
    const p = (localStorage.getItem(PHONE_KEY) || phone || '').trim()
    if (!u && !p) return

    try {
      const rows = await fetchUserTransactions({ phone: p, username: u })
      if (!Array.isArray(rows)) return

      const mapped = rows.map(mapServerTx)
      const prev = statusMapRef.current
      let approvedDeposit = false
      let approvedWithdraw = false

      for (const tx of mapped) {
        const before = prev[tx.id]
        if (before && before !== tx.status) {
          if (tx.status === 'APPROVED') {
            if (tx.kind === 'deposit') {
              approvedDeposit = true
              pushNotice(
                `${u || 'User'} [APPROVED] Deposit ${tx.amountLabel} · balance update ho raha hai`,
              )
            } else {
              approvedWithdraw = true
              pushNotice(`${u || 'User'} [APPROVED] Withdraw ${tx.amountLabel}`)
            }
          } else if (tx.status === 'REJECTED') {
            pushNotice(`${u || 'User'} [REJECTED] ${tx.title} ${tx.amountLabel}`)
          }
        }
        prev[tx.id] = tx.status
      }

      setTransactions(mapped.slice(0, 30))
      saveJson(TX_KEY, mapped.slice(0, 30))

      if (approvedDeposit || approvedWithdraw) {
        await refreshBalance(u, { quiet: true })
      }
    } catch {
      /* keep local list if offline */
    }
  }

  useEffect(() => {
    if (screen !== 'wallet' && screen !== 'withdraw' && screen !== 'profile') return undefined
    refreshBalance(username, { quiet: screen === 'wallet' })
    syncTransactions(username)
    const t = window.setInterval(() => {
      refreshBalance(username, { quiet: true })
      syncTransactions(username)
    }, SYNC_MS)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, username])

  const account = getPaymentAccount(method)
  const withdrawAccount = getPaymentAccount(withdrawMethod)
  void accountsReady

  const login = async () => {
    const u = username.trim()
    const p = password
    if (!u || !p) {
      flash('Username aur password likho')
      return
    }
    try {
      await verifyBpexchUser({ username: u, password: p })
    } catch (err) {
      flash(err.message || 'Login verify fail — pehle register karein')
      return
    }
    saveJson(STORAGE_KEY, { username: u, password: p })
    setUsername(u)
    setScreen('wallet')
    refreshBalance(u)
    syncTransactions(u)
  }

  const resetRegisterForm = () => {
    setRegPassword('')
    setRegConfirm('')
    setRegName('')
    setRegPhone('')
    setRegShowPass(false)
    setRegSubmitting(false)
    setRegError('')
    setRegCreated(null)
  }

  const openRegister = () => {
    resetRegisterForm()
    setScreen('register')
  }

  const submitRegister = async () => {
    setRegError('')
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password min 6 characters')
      return
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match')
      return
    }
    if (!regPhone.trim() || !/^[\d\s+\-()]{7,}$/.test(regPhone.trim())) {
      setRegError('Enter a valid phone number')
      return
    }
    setRegSubmitting(true)
    try {
      const data = await selfRegister({
        password: regPassword,
        confirmPassword: regConfirm,
        phone: regPhone.trim(),
        name: regName.trim(),
        countryCode: 'PK',
      })
      const createdUser = data.user?.username
      if (!createdUser) throw new Error('Account ban gaya magar username nahi mila')
      setRegCreated({ username: createdUser, password: regPassword })
      if (regPhone.trim()) {
        localStorage.setItem(PHONE_KEY, regPhone.trim())
        setPhone(regPhone.trim())
      }
    } catch (err) {
      setRegError(err.message || 'Failed to create account')
    } finally {
      setRegSubmitting(false)
    }
  }

  const finishRegisterLogin = () => {
    if (!regCreated) return
    const u = regCreated.username
    const p = regCreated.password
    setUsername(u)
    setPassword(p)
    saveJson(STORAGE_KEY, { username: u, password: p })
    resetRegisterForm()
    setScreen('wallet')
    refreshBalance(u)
    syncTransactions(u)
  }

  const logout = () => {
    clearSession()
    setUsername('')
    setPassword('')
    setScreen('login')
  }

  const onScreenshotFile = async (file) => {
    if (!file) {
      setScreenshotPreview('')
      setScreenshotData('')
      return
    }
    try {
      const dataUrl = await readScreenshotFile(file)
      setScreenshotData(dataUrl)
      setScreenshotPreview(dataUrl)
    } catch (err) {
      flash(err.message || 'Screenshot upload failed')
    }
  }

  const submitDeposit = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      flash('Phone number likho (10+ digits)')
      return
    }
    if (!screenshotData) {
      flash('Payment screenshot upload karo')
      return
    }
    setSubmitting(true)
    try {
      const tx = await createTransaction({
        type: 'deposit',
        amount: Number(amount),
        paymentMethodId: account.id,
        paymentMethodLabel: account.label,
        accountTitle: account.accountTitle,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        screenshot: screenshotData,
        name: username,
        phone: phone.trim(),
      })
      setUserPhone(phone.trim())
      localStorage.setItem(PHONE_KEY, phone.trim())
      const mapped = mapServerTx(tx)
      statusMapRef.current[mapped.id] = mapped.status
      pushTx(mapped)
      const bonus = Math.floor(Number(amount) * 0.1)
      pushNotice(
        `${username} [PENDING] Deposit PKR ${formatPkr(amount)} (+${formatPkr(bonus)} Bonus)`,
      )
      flash('Deposit admin pe bhej diya ✓')
      setAmount('')
      setScreenshotData('')
      setScreenshotPreview('')
      setScreen('wallet')
    } catch (err) {
      flash(err.message || 'Deposit failed — API check karo')
    } finally {
      setSubmitting(false)
    }
  }

  const submitWithdraw = async () => {
    const amt = Number(withdrawAmount)
    if (balance == null) {
      flash('Balance load nahi hua — dobara try karo')
      await refreshBalance()
      return
    }
    if (!(balance > minBalanceForWithdraw)) {
      flash(`Withdraw band — balance PKR ${minBalanceForWithdraw} se zyada chahiye`)
      return
    }
    if (!Number.isFinite(amt) || amt < 500) {
      flash('Minimum PKR 500')
      return
    }
    if (amt > balance) {
      flash(`Amount balance se zyada nahi (balance: PKR ${formatPkr(balance)})`)
      return
    }
    if (!holder.trim()) {
      flash('Account holder name likho')
      return
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      flash('Mobile number likho')
      return
    }
    setSubmitting(true)
    try {
      const tx = await createTransaction({
        type: 'withdraw',
        amount: amt,
        paymentMethodId: withdrawAccount.id,
        paymentMethodLabel: withdrawAccount.label,
        payoutAccountTitle: holder.trim(),
        payoutAccountNumber: mobile.trim(),
        name: username,
        phone: mobile.trim(),
        availableBalance: balance,
      })
      setUserPhone(mobile.trim())
      localStorage.setItem(PHONE_KEY, mobile.trim())
      const mapped = mapServerTx(tx)
      statusMapRef.current[mapped.id] = mapped.status
      pushTx(mapped)
      pushNotice(`${username} [PENDING] Withdraw PKR ${formatPkr(withdrawAmount)}`)
      flash('Withdraw admin pe bhej diya ✓')
      setWithdrawAmount('')
      setScreen('wallet')
      refreshBalance(username, { quiet: true })
    } catch (err) {
      flash(err.message || 'Withdraw failed — API check karo')
    } finally {
      setSubmitting(false)
    }
  }

  if (screen === 'login') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-navy-dark">
        <ScreenLogin
          username={username}
          password={password}
          onUsername={setUsername}
          onPassword={setPassword}
          onLogin={login}
          onRegister={openRegister}
        />
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'register') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-navy-dark">
        <ScreenRegister
          password={regPassword}
          confirmPassword={regConfirm}
          name={regName}
          phone={regPhone}
          showPass={regShowPass}
          submitting={regSubmitting}
          error={regError}
          created={regCreated}
          onPassword={setRegPassword}
          onConfirmPassword={setRegConfirm}
          onName={setRegName}
          onPhone={setRegPhone}
          onToggleShowPass={() => setRegShowPass((v) => !v)}
          onSubmit={submitRegister}
          onBack={() => {
            resetRegisterForm()
            setScreen('login')
          }}
          onGoLogin={finishRegisterLogin}
          onCopyCreds={async () => {
            if (!regCreated) return
            await copyText(
              `Username: ${regCreated.username}\nPassword: ${regCreated.password}`,
            )
            flash('Copied ✓')
          }}
        />
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'betting') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-navy-dark">
        <ScreenBetting
          username={username}
          password={password}
          onBack={() => setScreen('wallet')}
        />
        {chrome}
      </div>
    )
  }

  if (screen === 'profile') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#063822]">
        <ScreenProfile
          username={username}
          passwordMask={password ? '••••••••' : '••••••••'}
          balance={balance}
          balanceLoading={balanceLoading}
          onCopyUsername={() => {
            copyText(username)
            flash('Username copied')
          }}
          onCopyPassword={() => {
            copyText(password)
            flash(password ? 'Password copied' : 'No password saved')
          }}
          onLogout={logout}
          onOpenBetting={() => setScreen('betting')}
        />
        {chrome}
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'deposit') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
        <ScreenDeposit
          amount={amount}
          onAmountChange={setAmount}
          onBack={() => setScreen('wallet')}
          onNext={() => {
            if (Number(amount) < 1000) {
              flash('Minimum PKR 1,000')
              return
            }
            setMethodOpen(true)
            setScreen('method')
          }}
        />
        {chrome}
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'method') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
        <ScreenMethod
          amount={amount}
          method={method}
          methodOpen={methodOpen}
          accountTitle={account.accountTitle}
          accountNumber={account.accountNumber}
          onToggleMethods={() => setMethodOpen((v) => !v)}
          onSelectMethod={(id) => {
            setMethod(id)
            setMethodOpen(false)
          }}
          onCopyName={() => {
            copyText(account.accountTitle)
            flash('Name copied to clipboard')
          }}
          onCopyNumber={() => {
            copyText(account.accountNumber)
            flash('Number copied to clipboard')
          }}
          onPrevious={() => setScreen('deposit')}
          onNext={() => {
            if (methodOpen) {
              flash('Pehle payment method select karo')
              return
            }
            setScreen('proof')
          }}
        />
        {chrome}
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'proof') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
        <ScreenProof
          amount={amount}
          methodLabel={account.label}
          accountTitle={account.accountTitle}
          accountNumber={account.accountNumber}
          phone={phone}
          onPhoneChange={setPhone}
          screenshotPreview={screenshotPreview}
          onScreenshotChange={onScreenshotFile}
          submitting={submitting}
          onPrevious={() => setScreen('method')}
          onCopyName={() => {
            copyText(account.accountTitle)
            flash('Name copied to clipboard')
          }}
          onCopyNumber={() => {
            copyText(account.accountNumber)
            flash('Number copied to clipboard')
          }}
          onSubmit={submitDeposit}
        />
        {chrome}
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  if (screen === 'withdraw') {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
        <ScreenWithdraw
          method={withdrawMethod}
          onSelectMethod={setWithdrawMethod}
          amount={withdrawAmount}
          holder={holder}
          mobile={mobile}
          balance={balance}
          balanceLoading={balanceLoading}
          canWithdraw={canWithdraw}
          minBalanceForWithdraw={minBalanceForWithdraw}
          onAmount={setWithdrawAmount}
          onHolder={setHolder}
          onMobile={setMobile}
          onBack={() => setScreen('wallet')}
          submitting={submitting}
          onSubmit={submitWithdraw}
        />
        {chrome}
        {toast ? <Toast text={toast} /> : null}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#063822]">
      <ScreenWallet
        username={username}
        passwordMask={password ? '••••••••' : '••••••••'}
        balance={balance}
        balanceLoading={balanceLoading}
        notifications={notifications}
        transactions={transactions}
        onCopyUsername={() => {
          copyText(username)
          flash('Username copied')
        }}
        onCopyPassword={() => {
          copyText(password)
          flash(password ? 'Password copied' : 'No password saved')
        }}
        onDeposit={() => setScreen('deposit')}
        onWithdraw={() => {
          if (balance != null && !(balance > minBalanceForWithdraw)) {
            flash(`Withdraw band — balance PKR ${minBalanceForWithdraw} se zyada chahiye`)
            return
          }
          setScreen('withdraw')
        }}
        onOpenBetting={() => setScreen('betting')}
        onRefresh={() => {
          refreshBalance(username)
          syncTransactions(username)
        }}
        onLogout={logout}
      />
      {chrome}
      {toast ? <Toast text={toast} /> : null}
    </div>
  )
}

function Toast({ text }) {
  const isCopy = /copied/i.test(text)
  if (isCopy) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[110] flex flex-col items-center gap-2 px-4">
        <p className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-lg">
          Copied
        </p>
        <p className="w-full rounded-lg bg-accent px-4 py-2.5 text-center text-xs font-semibold text-navy-dark shadow-lg">
          {text}
        </p>
      </div>
    )
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[110] flex justify-center px-4">
      <p className="rounded-full bg-black/80 px-4 py-2 text-xs font-semibold text-white shadow-lg">
        {text}
      </p>
    </div>
  )
}
