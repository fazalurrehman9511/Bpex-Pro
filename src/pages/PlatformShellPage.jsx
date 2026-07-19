import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import PlatformEmbedPage from './PlatformEmbedPage'
import { setBpexchLoggedIn, isBpexchLoggedIn } from '../utils/bpexchAuth'
import { readWebLoginCreds } from '../utils/openBpexchExchange'

/** Clear rewritten BPEXCH cookies on bpexpro.com so old agent sessions don't stick */
function clearBpexchCookies() {
  const names = [
    'wex3authtoken',
    'wex3reftoken',
    'ASP.NET_SessionId',
    '.AspNetCore.Cookies',
    'AntiForgery.WebExchange',
  ]
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
  for (const name of names) {
    document.cookie = `${name}=; expires=${expires}; path=/`
    document.cookie = `${name}=; expires=${expires}; path=/bpexch`
  }
  try {
    for (const c of document.cookie.split(';')) {
      const key = c.split('=')[0]?.trim()
      if (!key) continue
      if (/wex3|asp\.?net|antiforgery|bpexch|webexchange/i.test(key)) {
        document.cookie = `${key}=; expires=${expires}; path=/`
        document.cookie = `${key}=; expires=${expires}; path=/bpexch`
      }
    }
  } catch {
    /* ignore */
  }
}

function postLoginToIframe(creds) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/bpexch/Users/Login'
  form.target = 'flowexch-platform'
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  const fields = {
    'user.Username': creds.username,
    'user.Password': creds.password,
    Device: 'BpxPro-Web',
    UtcOffset: String(-new Date().getTimezoneOffset()),
  }
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  form.remove()
}

/**
 * /dashboard — URL stays bpexpro.com/dashboard; BPEXCH loads in same-origin iframe.
 * Logs in the bettor who signed in on /login (not residual agent session).
 */
export default function PlatformShellPage() {
  const navigate = useNavigate()
  const [embedSrc, setEmbedSrc] = useState('/bpexch/Users/Login')
  const [booting, setBooting] = useState(true)
  const creds = readWebLoginCreds()
  const loggedIn = Boolean(creds?.username && creds?.password) || isBpexchLoggedIn()

  useEffect(() => {
    if (!creds?.username || !creds?.password) {
      navigate('/login', { replace: true })
      return undefined
    }

    setBpexchLoggedIn(true)
    clearBpexchCookies()
    setEmbedSrc('/bpexch/Users/Login')
    setBooting(false)

    /* 1) Open login in iframe, 2) POST bettor creds, 3) go to bettor dashboard */
    const t1 = window.setTimeout(() => {
      postLoginToIframe(creds)
    }, 700)

    const t2 = window.setTimeout(() => {
      setEmbedSrc('/bpexch/Common/Dashboard')
    }, 2200)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [creds?.username, creds?.password, navigate])

  if (!loggedIn || !creds?.username || booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-navy px-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Opening your exchange…</p>
      </div>
    )
  }

  return (
    <PlatformEmbedPage
      src={embedSrc}
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
      syncPublicUrl
    />
  )
}
