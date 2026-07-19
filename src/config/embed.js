const useProxy = import.meta.env.VITE_BPEXCH_USE_PROXY !== 'false'

export const BPEXCH_BASE_URL =
  import.meta.env.VITE_BPEXCH_BASE_URL || 'https://bpexch.xyz'

export const BPEXCH_LOGIN_URL = useProxy
  ? '/bpexch/Users/Login'
  : import.meta.env.VITE_BPEXCH_LOGIN_URL || `${BPEXCH_BASE_URL}/Users/Login`

export const BPEXCH_DASHBOARD_URL = useProxy
  ? '/bpexch/Common/Dashboard'
  : import.meta.env.VITE_BPEXCH_DASHBOARD_URL || `${BPEXCH_BASE_URL}/Common/Dashboard`

export function bpexchPath(path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`
  return useProxy ? `/bpexch${clean}` : `${BPEXCH_BASE_URL}${clean}`
}
