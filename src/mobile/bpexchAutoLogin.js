import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { BPEXCH_BASE_URL } from '../config/embed'
import { verifyBpexchUser } from '../utils/api'

function extractAntiForgery(html = '') {
  const match = String(html).match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="__RequestVerificationToken"/,
  )
  return match?.[1] || match?.[2] || ''
}

function submitLoginForm({ action, username, password, token = '' }) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  form.style.display = 'none'
  form.acceptCharset = 'UTF-8'

  const fields = {
    __RequestVerificationToken: token,
    'user.Username': username,
    'user.Password': password,
    Device: 'FlowExch-App',
    UtcOffset: String(-new Date().getTimezoneOffset()),
  }

  for (const [name, value] of Object.entries(fields)) {
    if (value === '' && name === '__RequestVerificationToken') continue
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}

/**
 * Open BPEXCH and sign in with the same FlowExch wallet credentials
 * so the user does not type password again.
 */
export async function openBpexchWithAppLogin({ username, password }) {
  const user = String(username || '').trim()
  const pass = String(password || '')
  if (!user || !pass) {
    throw new Error('Username / password missing')
  }

  await verifyBpexchUser({ username: user, password: pass })

  const isNative = Capacitor.isNativePlatform()
  let token = ''

  if (isNative) {
    try {
      const page = await CapacitorHttp.get({
        url: `${BPEXCH_BASE_URL}/Users/Login`,
        headers: {
          Accept: 'text/html',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        },
        responseType: 'text',
      })
      token = extractAntiForgery(typeof page.data === 'string' ? page.data : '')
    } catch {
      /* continue */
    }

    try {
      const auth = await CapacitorHttp.post({
        url: `${BPEXCH_BASE_URL}/api/Users/authenticate`,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        data: {
          username: user,
          password: pass,
          identity: 'FlowExch-App',
        },
      })
      const data = typeof auth.data === 'object' && auth.data ? auth.data : {}
      const tok =
        data.token || data.accessToken || data.authToken || data.wex3authtoken || data.Token
      if (auth.status >= 200 && auth.status < 300 && tok) {
        window.location.href = `${BPEXCH_BASE_URL}/index`
        return { mode: 'api' }
      }
    } catch {
      /* form fallback */
    }

    /* Top-level POST — iframe is blocked by BPEXCH X-Frame-Options */
    submitLoginForm({
      action: `${BPEXCH_BASE_URL}/Users/Login`,
      username: user,
      password: pass,
      token,
    })
    return { mode: 'form' }
  }

  /* Browser — always POST to real BPEXCH origin (iframe/proxy hits Cloudflare on host IP) */
  try {
    const page = await fetch(`${BPEXCH_BASE_URL}/Users/Login`, {
      credentials: 'include',
      mode: 'cors',
    })
    const html = await page.text()
    token = extractAntiForgery(html)
  } catch {
    /* continue — antiforgery optional for many BPEXCH hosts */
  }

  submitLoginForm({
    action: `${BPEXCH_BASE_URL}/Users/Login`,
    username: user,
    password: pass,
    token,
  })
  return { mode: 'form-direct' }
}
