import { fetchWhatsappAgents } from '../utils/api'

/** Static fallbacks — overridden by admin DB via loadWhatsappAgents() */
export const countries = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dialCode: '+92',
    phonePlaceholder: '300 1234567',
    whatsapp: import.meta.env.VITE_WHATSAPP_PK || '923001234567',
  },
  {
    code: 'AE',
    name: 'UAE',
    flag: '🇦🇪',
    dialCode: '+971',
    phonePlaceholder: '50 123 4567',
    whatsapp: import.meta.env.VITE_WHATSAPP_AE || '971501234567',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    phonePlaceholder: '50 123 4567',
    whatsapp: import.meta.env.VITE_WHATSAPP_SA || '966501234567',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    phonePlaceholder: '7700 900123',
    whatsapp: import.meta.env.VITE_WHATSAPP_GB || '447700900123',
  },
]

let cache = [...countries]

export function getCountries() {
  return cache
}

export function getCountryByCode(code) {
  return cache.find((c) => c.code === code) ?? cache[0] ?? countries[0]
}

export function getWhatsAppNumber(countryCode) {
  return getCountryByCode(countryCode).whatsapp
}

/** Pull latest WhatsApp agent numbers from server (admin-editable). */
export async function loadWhatsappAgents() {
  try {
    const list = await fetchWhatsappAgents()
    if (Array.isArray(list) && list.length) {
      cache = list.map((row) => ({
        code: row.code,
        name: row.name,
        flag: row.flag || '',
        dialCode: row.dialCode || '',
        phonePlaceholder: row.phonePlaceholder || '',
        whatsapp: row.whatsapp || '',
      }))
    }
  } catch (err) {
    console.warn('WhatsApp agents load failed, using defaults:', err.message)
  }
  return cache
}
