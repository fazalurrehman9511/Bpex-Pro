const WHATSAPP_NUMBERS = {
  PK: import.meta.env.VITE_WHATSAPP_PK,
  IN: import.meta.env.VITE_WHATSAPP_IN,
  AE: import.meta.env.VITE_WHATSAPP_AE,
  SA: import.meta.env.VITE_WHATSAPP_SA,
  GB: import.meta.env.VITE_WHATSAPP_GB,
  US: import.meta.env.VITE_WHATSAPP_US,
  BD: import.meta.env.VITE_WHATSAPP_BD,
  DEFAULT: import.meta.env.VITE_WHATSAPP_DEFAULT || import.meta.env.VITE_WHATSAPP_PK || '923001234567',
}

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
