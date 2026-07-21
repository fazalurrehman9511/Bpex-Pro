/** FlowExch-owned routes — not BPEXCH platform pages */
const FLOWEXCH_EXACT = new Set([
  '/',
  '/login',
  '/dashboard',
  '/deposit',
  '/withdraw',
  '/blog',
  '/admin',
])

const BPEXCH_PATH_PATTERN =
  /^\/(Common|Home|Users|Accounts|Market|Report|Dashboard|blank)(\/|$)/i

export function isFlowExchRoute(pathname = '') {
  if (FLOWEXCH_EXACT.has(pathname)) return true
  if (pathname.startsWith('/blog/')) return true
  if (pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) return true
  return false
}

export function isBpexchLoginPath(pathname = '') {
  return /^\/users\/login\/?$/i.test(pathname)
}

export function isBpexchInternalPath(pathname = '') {
  const path = String(pathname || '/').split('?')[0]
  if (isBpexchLoginPath(path)) return true
  return BPEXCH_PATH_PATTERN.test(path)
}

/** Fullscreen BPEXCH embed — only /dashboard in the address bar */
export function isPlatformEmbedRoute(pathname = '') {
  return pathname === '/dashboard'
}

/** Strip /bpexch prefix and map internal paths to clean FlowExch URLs */
export function normalizePublicPath(pathname = '', search = '') {
  let path = String(pathname || '/').trim()
  if (!path.startsWith('/')) path = `/${path}`
  if (path.startsWith('/bpexch')) {
    path = path.slice('/bpexch'.length) || '/'
    if (!path.startsWith('/')) path = `/${path}`
  }

  if (isBpexchLoginPath(path)) return `/login${search || ''}`
  if (isBpexchInternalPath(path) || /^\/Common\/Dashboard|^\/Home|^\/home\/?$/i.test(path)) {
    return `/dashboard${search || ''}`
  }

  return `${path}${search || ''}`
}

export function toPublicPath(pathname = '', search = '') {
  return normalizePublicPath(pathname, search)
}

/** Never mirror BPEXCH iframe paths in the browser URL — keep /dashboard only */
export function shouldSyncPublicPath(_pathname = '') {
  return false
}

/** Iframe src for a clean browser path */
export function toBpexchProxySrc(pathname = '/', search = '') {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return '/bpexch/Common/Dashboard'
  }
  if (pathname === '/login') {
    return '/bpexch/Users/Login'
  }
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `/bpexch${clean}${search || ''}`
}

export function publicPathFromLocation(location) {
  return toPublicPath(location.pathname, location.search)
}

/** Redirect old/bpexch URLs to clean FlowExch routes */
export function repairPublicLocation(pathname = '') {
  if (pathname.startsWith('/dashboard/')) return '/dashboard'
  if (/^\/blank(\/|$)/i.test(pathname)) return '/dashboard'
  if (isFlowExchRoute(pathname)) return pathname
  if (isBpexchLoginPath(pathname)) return '/login'
  if (isBpexchInternalPath(pathname)) return '/dashboard'
  return pathname
}
