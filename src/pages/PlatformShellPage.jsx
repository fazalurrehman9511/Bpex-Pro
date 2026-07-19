import { useEffect } from 'react'
import PlatformEmbedPage from './PlatformEmbedPage'
import { setBpexchLoggedIn, isBpexchLoggedIn } from '../utils/bpexchAuth'
import { readWebLoginCreds } from '../utils/openBpexchExchange'
import { useNavigate } from 'react-router-dom'

/**
 * Betting dashboard — browser URL stays https://bpexpro.com/dashboard
 * Content loads via same-origin /bpexch proxy iframe.
 */
export default function PlatformShellPage() {
  const navigate = useNavigate()
  const loggedIn = isBpexchLoggedIn() || Boolean(readWebLoginCreds())

  useEffect(() => {
    if (!loggedIn) {
      navigate('/login', { replace: true })
      return
    }
    setBpexchLoggedIn(true)

    const creds = readWebLoginCreds()
    if (!creds?.username || !creds?.password) return undefined

    /* Auto sign-in into the named iframe (URL bar stays /dashboard) */
    const t = window.setTimeout(() => {
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
    }, 600)

    return () => window.clearTimeout(t)
  }, [loggedIn, navigate])

  if (!loggedIn) return null

  return (
    <PlatformEmbedPage
      src="/bpexch/Common/Dashboard"
      title="Dashboard"
      pageTitle="Dashboard — BpxPro"
      listenForActions
      syncPublicUrl
    />
  )
}
