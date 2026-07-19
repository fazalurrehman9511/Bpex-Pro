import { getEmbedBrandName, rewriteBpexchContent, rewriteBpexchHeaders } from './src/utils/bpexchRewrite.js'
import { extractUserFromRequest, isUserEditPath } from './server/src/utils/bpexchUser.js'
import { toPublicPath } from './src/utils/platformPaths.js'

const BPEXCH_TARGET = 'https://bpexch.xyz'

function getProxyOptions(pluginOptions = {}) {
  return {
    brandName: getEmbedBrandName(pluginOptions.brandName),
    syncSecret: pluginOptions.syncSecret || process.env.BPEXCH_SYNC_SECRET || '',
    apiBaseUrl: pluginOptions.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3001',
    /** Optional undici/proxy-aware fetch (server passes bpexchHttpFetch) */
    fetchImpl: typeof pluginOptions.fetchImpl === 'function' ? pluginOptions.fetchImpl : null,
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function getSetCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie()
  }
  const raw = response.headers.get('set-cookie')
  return raw ? [raw] : []
}

/** Top-level browser hit on /bpexch/* → redirect to clean URL (iframe/AJAX still proxy). */
function shouldRedirectToPublicUrl(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false

  /*
   * ONLY real top-level document navigations.
   * AJAX/fetch partials use sec-fetch-dest: empty — must NOT redirect
   * (otherwise Sport Highlights / user lists get React HTML instead of BPEXCH data).
   * Iframe loads use sec-fetch-dest: iframe — must proxy, not redirect.
   */
  const dest = (req.headers['sec-fetch-dest'] || '').toLowerCase()
  if (dest !== 'document') return false

  const accept = req.headers.accept || ''
  if (!accept.includes('text/html')) return false

  /* jQuery AJAX often still sends Accept including text/html - block those */
  const xhr = (req.headers['x-requested-with'] || '').toLowerCase()
  if (xhr === 'xmlhttprequest') return false

  const mode = (req.headers['sec-fetch-mode'] || '').toLowerCase()
  if (mode && mode !== 'navigate') return false

  return true
}

async function syncUserToApi(pathname, body, contentType, proxyOptions) {
  const result = extractUserFromRequest(pathname, body, contentType)
  if (!result) {
    if (isUserEditPath(pathname) && body?.length) {
      console.log('[bpexch-proxy] Edit POST skipped — username missing in body (client should inject it)')
    }
    return
  }

  const { user, mode } = result

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (proxyOptions.syncSecret) {
      headers['X-Sync-Secret'] = proxyOptions.syncSecret
    }

    const res = await fetch(`${proxyOptions.apiBaseUrl}/api/bpexch/users/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...user, mode }),
    })

    if (res.ok) {
      console.log(`[bpexch-proxy] ${mode === 'edit' ? 'Updated' : 'Synced'} user: ${user.username}`)
    } else if (res.status === 404) {
      console.log(`[bpexch-proxy] Edit skipped — not in DB: ${user.username}`)
    } else {
      const err = await res.text()
      console.error(`[bpexch-proxy] Sync failed for ${user.username}:`, err)
    }
  } catch (err) {
    console.error('[bpexch-proxy] User sync failed:', err.message)
  }
}

function isBpexchLoginPath(pathname = '') {
  const p = pathname.toLowerCase()
  return (
    p === '/users/login' ||
    p.startsWith('/users/login?') ||
    p === '/api/users/authenticate' ||
    p.startsWith('/api/users/authenticate')
  )
}

function extractLoginCredentials(body, contentType = '') {
  if (!body?.length) return null
  const raw = body.toString('utf8')
  const ct = String(contentType || '').toLowerCase()

  if (ct.includes('application/json')) {
    try {
      const data = JSON.parse(raw)
      const username = String(
        data.username || data.Username || data.userName || data?.user?.Username || '',
      ).trim()
      const password = String(
        data.password || data.Password || data?.user?.Password || '',
      )
      return username ? { username, password } : null
    } catch {
      return null
    }
  }

  try {
    const params = new URLSearchParams(raw)
    const username = String(
      params.get('user.Username') ||
        params.get('Username') ||
        params.get('username') ||
        '',
    ).trim()
    const password = String(
      params.get('user.Password') || params.get('Password') || params.get('password') || '',
    )
    return username ? { username, password } : null
  } catch {
    return null
  }
}

async function assertLocalUserAllowed(body, contentType, proxyOptions) {
  const creds = extractLoginCredentials(body, contentType)
  if (!creds?.username) {
    return {
      ok: false,
      status: 400,
      error: 'Username is required',
    }
  }
  try {
    const res = await fetch(`${proxyOptions.apiBaseUrl}/api/bpexch/users/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: creds.username,
        password: creds.password,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        status: res.status === 400 ? 400 : 403,
        error:
          data.error ||
          'Yeh account hamari system mein register nahi hai. Pehle register karein.',
      }
    }
    return { ok: true, username: data.username || creds.username }
  } catch (err) {
    console.error('[bpexch-proxy] Login verify failed:', err.message)
    return {
      ok: false,
      status: 503,
      error: 'Login verification temporarily unavailable. Try again.',
    }
  }
}

function sendLoginDenied(res, { status, error }, asJson) {
  if (asJson) {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(JSON.stringify({ ok: false, error, errorCode: 'local_user_required' }))
    return
  }
  const safe = String(error || 'Access denied')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Login blocked</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#0f1923;color:#e8eef5;padding:24px}
.box{max-width:420px;width:100%;border:1px solid #2a3a4d;border-radius:12px;background:#1a2634;padding:24px}
h1{margin:0 0 8px;font-size:18px;color:#25d366}p{margin:0;font-size:14px;line-height:1.5;color:#9aa8b8}
a{display:inline-block;margin-top:16px;color:#25d366;font-weight:700;text-decoration:none}
</style></head><body><div class="box">
<h1>Login not allowed</h1>
<p>${safe}</p>
<a href="/login">← Back to login</a>
<a href="/" style="margin-left:12px">Home</a>
</div></body></html>`)
}

async function proxyBpexch(req, res, proxyOptions = {}) {
  const url = new URL(req.url, 'http://localhost')
  const targetPath = url.pathname.replace(/^\/bpexch/, '') || '/'
  const targetUrl = `${BPEXCH_TARGET}${targetPath}${url.search}`

  const body =
    req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : undefined

  if (
    body?.length &&
    (req.method === 'POST' || req.method === 'PUT') &&
    isBpexchLoginPath(targetPath)
  ) {
    const gate = await assertLocalUserAllowed(
      body,
      req.headers['content-type'] || '',
      proxyOptions,
    )
    if (!gate.ok) {
      console.warn(`[bpexch-proxy] Login blocked for local DB check: ${gate.error}`)
      const asJson =
        String(req.headers.accept || '').includes('application/json') ||
        String(req.headers['content-type'] || '').includes('application/json') ||
        targetPath.toLowerCase().includes('/api/')
      sendLoginDenied(res, gate, asJson)
      return
    }
    console.log(`[bpexch-proxy] Login allowed (in DB): ${gate.username}`)
  }

  const forwardHeaders = {
    'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    accept: req.headers.accept || '*/*',
    'accept-language': req.headers['accept-language'] || 'en-US,en;q=0.9',
    cookie: req.headers.cookie || '',
    referer: `${BPEXCH_TARGET}${targetPath}`,
    origin: BPEXCH_TARGET,
    /* Avoid compressed bodies that some edge cases mishandle */
    'accept-encoding': 'identity',
  }

  /* Forward auth / AJAX / antiforgery headers BPEXCH expects */
  const passthrough = [
    'content-type',
    'content-length',
    'x-requested-with',
    'authorization',
    'requestverificationtoken',
    'x-csrf-token',
    'x-xsrf-token',
  ]
  for (const key of passthrough) {
    if (req.headers[key]) forwardHeaders[key] = req.headers[key]
  }

  const doFetch = proxyOptions.fetchImpl || fetch
  const response = await doFetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: body?.length ? body : undefined,
    redirect: 'manual',
  })

  if (body?.length && (req.method === 'POST' || req.method === 'PUT')) {
    await syncUserToApi(targetPath, body, req.headers['content-type'] || '', proxyOptions)
  }

  const contentType = response.headers.get('content-type') || ''
  const isRewriteable =
    contentType.includes('text/html') ||
    contentType.includes('text/css') ||
    contentType.includes('javascript') ||
    contentType.includes('json')

  let responseBody = isRewriteable
    ? rewriteBpexchContent(await response.text(), contentType, proxyOptions)
    : Buffer.from(await response.arrayBuffer())

  const setCookies = getSetCookies(response)
  const { headers: outHeaders, cookies: rewrittenCookies } = rewriteBpexchHeaders(
    Object.fromEntries(response.headers.entries()),
    setCookies
  )

  if (typeof responseBody === 'string') {
    const base = contentType.split(';')[0]
    outHeaders['content-type'] = `${base}; charset=utf-8`
    /* Bust browser cache of previously broken rewritten JS/CSS/HTML */
    if (
      contentType.includes('javascript') ||
      contentType.includes('text/html') ||
      contentType.includes('text/css')
    ) {
      outHeaders['cache-control'] = 'no-store, no-cache, must-revalidate, max-age=0'
      outHeaders['pragma'] = 'no-cache'
      delete outHeaders.etag
      delete outHeaders.age
      delete outHeaders['last-modified']
    }
  }

  if (rewrittenCookies.length > 0) {
    delete outHeaders['Set-Cookie']
    delete outHeaders['set-cookie']
    /* Must set before writeHead — multiple Set-Cookie values as array */
    res.setHeader('Set-Cookie', rewrittenCookies)
  }

  res.writeHead(response.status, outHeaders)
  res.end(responseBody)
}

/** FlowExch Express API — leave these for Vite → localhost:3001 */
function isFlowExchApiPath(pathname = '') {
  return (
    pathname.startsWith('/api/transactions') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/blog') ||
    pathname.startsWith('/api/bpexch') ||
    pathname.startsWith('/api/live-events') ||
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/register') ||
    pathname.startsWith('/api/payment-accounts') ||
    pathname.startsWith('/api/whatsapp-agents') ||
    pathname.startsWith('/api/health')
  )
}

/**
 * Connect/Express middleware for /bpexch/* (dev Vite + production Node/cPanel).
 * Mount BEFORE static SPA. Do not mount with a path prefix (handles /bpexch itself).
 */
export function createBpexchProxyMiddleware(options = {}) {
  const proxyOptions = getProxyOptions(options)

  return async function bpexchProxyMiddleware(req, res, next) {
    const rawUrl = req.originalUrl || req.url || ''
    const pathname = rawUrl.split('?')[0]
    if (!pathname.startsWith('/bpexch')) return next()

    // Ensure proxy sees a /bpexch-prefixed URL (Vite Connect + Express)
    req.url = rawUrl

    if (shouldRedirectToPublicUrl(req)) {
      const url = new URL(req.url, 'http://localhost')
      const location = toPublicPath(url.pathname, url.search)
      res.writeHead(302, { Location: location })
      res.end()
      return
    }

    try {
      await proxyBpexch(req, res, proxyOptions)
    } catch (err) {
      console.error('[bpexch-proxy]', err.message)
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('BPEXCH proxy error')
      }
    }
  }
}

/** If BPEXCH JS calls /api/users/* before our iframe hooks, route to BPEXCH not Express */
export function createStrayBpexchApiRewrite() {
  return function rewriteStrayBpexchApi(req, _res, next) {
    const raw = req.url || ''
    if (!raw.startsWith('/api/')) return next()
    const pathname = raw.split('?')[0]
    if (isFlowExchApiPath(pathname)) return next()
    req.url = `/bpexch${raw}`
    next()
  }
}

/** Vite dev/preview middleware — proxies /bpexch/* and rewrites asset paths */
export function bpexchProxyPlugin(options = {}) {
  const rewriteStrayBpexchApi = createStrayBpexchApiRewrite()
  const handler = createBpexchProxyMiddleware(options)

  return {
    name: 'bpexch-proxy',
    configureServer(server) {
      server.middlewares.use(rewriteStrayBpexchApi)
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteStrayBpexchApi)
      server.middlewares.use(handler)
    },
  }
}

// Re-export for tests
export { extractUserFromRequest }
