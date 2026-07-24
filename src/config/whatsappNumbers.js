import { fetchSupportContact } from '../utils/api'

const WHATSAPP_NUMBERS = {
  PK: import.meta.env.VITE_WHATSAPP_PK,
  IN: import.meta.env.VITE_WHATSAPP_IN,
  AE: import.meta.env.VITE_WHATSAPP_AE,
  SA: import.meta.env.VITE_WHATSAPP_SA,
  GB: import.meta.env.VITE_WHATSAPP_GB,
  US: import.meta.env.VITE_WHATSAPP_US,
  BD: import.meta.env.VITE_WHATSAPP_BD,
  SUPPORT: import.meta.env.VITE_WHATSAPP_SUPPORT,
  DEFAULT: import.meta.env.VITE_WHATSAPP_DEFAULT || import.meta.env.VITE_WHATSAPP_PK || '923001234567',
}

let supportWhatsAppCache = WHATSAPP_NUMBERS.SUPPORT || WHATSAPP_NUMBERS.DEFAULT

export const COUNTRY_LABELS = {
  PK: 'Pakistan',
  IN: 'India',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  GB: 'United Kingdom',
  US: 'United States',
  BD: 'Bangladesh',
}

export function getWhatsAppNumber(countryCode) {
  const code = countryCode?.toUpperCase()
  return WHATSAPP_NUMBERS[code] || WHATSAPP_NUMBERS.DEFAULT
}

export function getSupportWhatsAppNumber() {
  return supportWhatsAppCache || WHATSAPP_NUMBERS.SUPPORT || WHATSAPP_NUMBERS.DEFAULT
}

export async function loadSupportWhatsAppNumber() {
  try {
    const data = await fetchSupportContact()
    const next = String(data?.whatsapp || '').replace(/[^\d]/g, '')
    if (next) supportWhatsAppCache = next
  } catch (err) {
    console.warn('Support WhatsApp load failed, using fallback:', err.message)
  }
  return getSupportWhatsAppNumber()
}
