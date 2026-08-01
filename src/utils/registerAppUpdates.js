const VERSION_KEY = 'flowexch.app.version'
const RELOAD_GUARD_KEY = 'flowexch.app.reload'

/** @type {ReturnType<typeof setInterval> | null} */
let versionPollTimer = null

function currentBuildId() {
  return typeof __APP_BUILD_ID__ !== 'undefined' ? String(__APP_BUILD_ID__) : ''
}

async function clearWebCaches() {
  if (!('caches' in window)) return
  const keys = await caches.keys()
  await Promise.all(keys.map((key) => caches.delete(key)))
}

async function hardReload(nextVersion) {
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) === nextVersion) return
  sessionStorage.setItem(RELOAD_GUARD_KEY, nextVersion)
  try {
    sessionStorage.setItem(VERSION_KEY, nextVersion)
  } catch {
    /* ignore */
  }

  await clearWebCaches()

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.unregister()
  } catch {
    /* ignore */
  }

  window.location.reload()
}

async function fetchRemoteVersion() {
  const res = await fetch(`/version.json?ts=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  const version = String(data?.version || '').trim()
  return version || null
}

export async function checkForAppUpdate() {
  if (!import.meta.env.PROD) return false

  const remote = await fetchRemoteVersion()
  if (!remote) return false

  const local =
    sessionStorage.getItem(VERSION_KEY) ||
    document.querySelector('meta[name="app-build-id"]')?.getAttribute('content') ||
    currentBuildId()

  if (!local) {
    try {
      sessionStorage.setItem(VERSION_KEY, remote)
    } catch {
      /* ignore */
    }
    return false
  }

  if (remote !== local) {
    await hardReload(remote)
    return true
  }

  return false
}

function startVersionPolling() {
  if (versionPollTimer || !import.meta.env.PROD) return

  const tick = () => {
    void checkForAppUpdate()
  }

  tick()
  versionPollTimer = window.setInterval(tick, 5 * 60 * 1000)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })
  window.addEventListener('focus', tick)
}

function wireServiceWorkerUpdates(registration) {
  if (!registration) return

  const ping = () => {
    void registration.update().catch(() => {})
  }

  ping()
  window.setInterval(ping, 60 * 60 * 1000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ping()
  })
  window.addEventListener('focus', ping)
}

/** Register SW + auto refresh when a new deploy is detected. */
export function registerAppUpdates() {
  if (!import.meta.env.PROD) return

  const bootVersion = currentBuildId()
  if (bootVersion) {
    try {
      if (!sessionStorage.getItem(VERSION_KEY)) {
        sessionStorage.setItem(VERSION_KEY, bootVersion)
      }
    } catch {
      /* ignore */
    }
  }

  startVersionPolling()

  if (!('serviceWorker' in navigator)) return

  const register = () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegisteredSW(_swUrl, registration) {
            wireServiceWorkerUpdates(registration)
          },
        })
      })
      .catch(() => {})
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
