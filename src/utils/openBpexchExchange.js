import { BPEXCH_BASE_URL } from '../config/embed'

const CREDS_KEY = 'bpxpro_web_creds'

export function saveWebLoginCreds({ username, password }) {
  try {
    sessionStorage.setItem(
      CREDS_KEY,
      JSON.stringify({
        username: String(username || '').trim(),
        password: String(password || ''),
      }),
    )
  } catch {
    /* ignore */
  }
}

export function readWebLoginCreds() {
  try {
    const raw = sessionStorage.getItem(CREDS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.username || !data?.password) return null
    return data
  } catch {
    return null
  }
}

export function clearWebLoginCreds() {
  try {
    sessionStorage.removeItem(CREDS_KEY)
  } catch {
    /* ignore */
  }
}

function submitBpexchLogin({ username, password }) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `${BPEXCH_BASE_URL}/Users/Login`
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  const fields = {
    'user.Username': username,
    'user.Password': password,
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
}

/**
 * Dashboard → leave BpxPro and open BPEXCH exchange (browser URL becomes bpexch.xyz).
 * Home / deposit / withdraw stay on bpexpro.com.
 */
export function openBpexchExchange() {
  const creds = readWebLoginCreds()
  if (creds?.username && creds?.password) {
    submitBpexchLogin(creds)
    return true
  }
  window.location.href = `${BPEXCH_BASE_URL}/Users/Login`
  return false
}
