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

/** Link target for homepage sections — scrolls without adding # to the URL. */
export function sectionLinkTarget(sectionId) {
  const id = String(sectionId || '').replace(/^#+/, '').trim()
  if (!id) return { pathname: '/' }
  return { pathname: '/', state: { scrollTo: id } }
}

export function navigateToSection(id, navigate, pathname) {
  const sectionId = String(id || '').replace(/^#+/, '').trim()
  if (!sectionId) return

  if (pathname !== '/') {
    navigate('/', { state: { scrollTo: sectionId } })
    return
  }

  scrollToSection(sectionId)
  if (window.location.hash) {
    navigate('/', { replace: true })
  }
}
