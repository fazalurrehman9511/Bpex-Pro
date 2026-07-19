import {
  getAdminToken,
  clearAdminToken,
  adminLogin as apiAdminLogin,
} from './api'

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
}

export async function loginAdmin(username, password) {
  try {
    await apiAdminLogin(username, password)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function logoutAdmin() {
  clearAdminToken()
}
