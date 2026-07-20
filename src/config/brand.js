/** Public brand — site header, footer, titles, WhatsApp copy */
export const BRAND_NAME = 'BpxPro'
export const BRAND_SHORT = 'BPX'
/** Square BPX mark — use for header, favicon, PWA, app */
export const BRAND_LOGO = '/icon-72x72.png'
export const BRAND_LOGO_MD = '/icon-192x192.png'
export const BRAND_LOGO_LG = '/icon-512x512.png'
export const BRAND_TAGLINE = "Pakistan's trusted betting exchange"

/** Public site domain (production) — prefer www to match live canonical */
export const SITE_DOMAIN = (import.meta.env.VITE_SITE_DOMAIN || 'www.bpexpro.com').trim()
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || `https://${SITE_DOMAIN}`
)
  .trim()
  .replace(/\/$/, '')
