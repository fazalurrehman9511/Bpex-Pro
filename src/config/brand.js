/** Public brand — site header, footer, titles, WhatsApp copy */
export const BRAND_NAME = 'BpxPro'
export const BRAND_SHORT = 'BPX'
export const BRAND_ALIASES = ['BPX', 'BPEXCH', 'BPXPRO', 'BettPro', 'Bett Pro']
export const BRAND_ALIAS_TEXT = 'BPX, BPEXCH, BPXPRO, BettPro and Bett Pro'
/** Square BP circle mark — PWA + native app */
export const BRAND_LOGO = '/bp-circle-icon.png'
export const BRAND_LOGO_MD = '/icon-192x192.png'
export const BRAND_LOGO_LG = '/icon-512x512.png'
/** Circular BP mark used on native login + exchange embed */
export const BPEXCH_LOGIN_LOGO = '/bp-circle-icon.png'
export const BRAND_TAGLINE = "Asia's trusted betting exchange"

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

/** Public site domain (production) — prefer www to match live canonical */
export const SITE_DOMAIN = (viteEnv.VITE_SITE_DOMAIN || 'www.bpexpro.com').trim()
export const SITE_URL = (
  viteEnv.VITE_SITE_URL || `https://${SITE_DOMAIN}`
)
  .trim()
  .replace(/\/$/, '')
