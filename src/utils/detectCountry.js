export function detectCountryCode() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  const tzMap = {
    Karachi: 'PK',
    Islamabad: 'PK',
    Dubai: 'AE',
    Riyadh: 'SA',
    London: 'GB',
    Dhaka: 'BD',
    Kolkata: 'IN',
    Mumbai: 'IN',
    Delhi: 'IN',
  }
  for (const [key, code] of Object.entries(tzMap)) {
    if (tz.includes(key)) return code
  }

  const lang = (navigator.language || '').toUpperCase()
  const langMap = { PK: 'PK', AE: 'AE', SA: 'SA', GB: 'GB', BD: 'BD', IN: 'IN' }
  for (const [key, code] of Object.entries(langMap)) {
    if (lang.includes(key)) return code
  }

  return 'PK'
}

export function scrollToSection(id) {
  const sectionId = String(id || '').replace(/^#+/, '').trim()
  if (!sectionId) return
  const el = document.getElementById(sectionId)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function navigateToSection(id, navigate, pathname) {
  const sectionId = String(id || '').replace(/^#+/, '').trim()
  if (!sectionId) return

  if (pathname !== '/') {
    navigate({ pathname: '/', hash: sectionId })
    return
  }

  const currentHash = window.location.hash.replace(/^#+/, '')
  if (currentHash !== sectionId) {
    navigate({ pathname: '/', hash: sectionId }, { replace: true })
  }
  scrollToSection(sectionId)
}
