import { BPEXCH_BASE_URL } from '../config/embed'
import { getBpexchPassword, getBpexchUsername } from './bpexchAuth'

export const BPEXCH_LOGIN_EXTERNAL_URL = `${BPEXCH_BASE_URL}/Users/Login`

function appendHiddenInput(form, name, value) {
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = name
  input.value = String(value ?? '')
  form.appendChild(input)
}

function submitExternalLoginForm({ target, username, password }) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = BPEXCH_LOGIN_EXTERNAL_URL
  form.target = target
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  appendHiddenInput(form, 'user.Username', username)
  appendHiddenInput(form, 'user.Password', password)
  appendHiddenInput(form, 'Device', 'FlowExch-Web')
  appendHiddenInput(form, 'UtcOffset', String(-new Date().getTimezoneOffset()))

  document.body.appendChild(form)
  form.submit()
  form.remove()
}

export function openBpexchLoginInNewTab({ username, password } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const user = String(username ?? getBpexchUsername()).trim()
  const pass = String(password ?? getBpexchPassword())
  const target = `flowexch-bpexch-${Date.now()}`
  const popup = window.open('', target)

  if (!popup) return false

  try {
    popup.opener = null
  } catch {
    /* ignore */
  }

  if (!user || !pass) {
    popup.location.href = BPEXCH_LOGIN_EXTERNAL_URL
    return true
  }

  submitExternalLoginForm({
    target,
    username: user,
    password: pass,
  })
  return true
}
