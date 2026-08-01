/** Public brand — site header, footer, titles, WhatsApp copy */
export const BRAND_NAME = 'BpxPro'
export const BRAND_SHORT = 'BPX'
export const BRAND_ALIASES = ['BPX', 'BPEXCH', 'BPXPRO', 'BettPro', 'Bett Pro']
export const BRAND_ALIAS_TEXT = 'BPX, BPEXCH, BPXPRO, BettPro and Bett Pro'
/** Square BPX mark — use for header, favicon, PWA, app */
export const BRAND_LOGO = '/icon-72x72.png'
export const BRAND_LOGO_MD = '/icon-192x192.png'
export const BRAND_LOGO_LG = '/icon-512x512.png'
/** Same mark as bpexch.xyz /Users/Login */
export const BPEXCH_LOGIN_LOGO = '/bpexch-login-logo.jpg'
export const BRAND_TAGLINE = "Asia's trusted betting exchange"

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

/** Public site domain (production) — prefer www to match live canonical */
export const SITE_DOMAIN = (viteEnv.VITE_SITE_DOMAIN || 'www.bpexpro.com').trim()
export const SITE_URL = (
  viteEnv.VITE_SITE_URL || `https://${SITE_DOMAIN}`
)
  .trim()
  .replace(/\/$/, '')
