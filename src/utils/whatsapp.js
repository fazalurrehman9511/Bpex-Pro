import { getWhatsAppNumber, getCountryByCode } from '../data/countries'
import { getSupportWhatsAppNumber } from '../config/whatsappNumbers'
import { getPaymentMethod } from '../data/paymentMethods'
import { detectCountryCode } from './detectCountry'

const intentMessages = {
  register: 'register on BpxPro',
  login: 'login to my BpxPro account',
  contact: 'contact my betting agent',
  deposit: 'add balance to my account',
  withdraw: 'withdraw from my account',
}

export const QUICK_CHAT_OPTIONS = [
  {
    id: 'hello',
    label: 'Say hello',
    text: 'Hi BpxPro! 👋\n\nI need help with my account.\nPlease assist me.',
  },
  {
    id: 'register',
    label: 'Register account',
    text: 'Hi BpxPro! 👋\n\nI want to register a new account.\nPlease help me get started.',
  },
  {
    id: 'deposit',
    label: 'Add balance',
    text: 'Hi BpxPro! 👋\n\nI want to add balance to my account.\nPlease share deposit details.',
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    text: 'Hi BpxPro! 👋\n\nI want to make a withdrawal.\nPlease assist me.',
  },
]

const quickMessages = {
  contact: QUICK_CHAT_OPTIONS[0].text,
  register: QUICK_CHAT_OPTIONS[1].text,
  deposit: QUICK_CHAT_OPTIONS[2].text,
  withdraw: QUICK_CHAT_OPTIONS[3].text,
}

export function buildWhatsAppUrl({ name, phone, intent = 'register', countryCode = 'PK', paymentMethod }) {
  const action = intentMessages[intent] || intentMessages.register
  const country = getCountryByCode(countryCode)
  const number = getWhatsAppNumber(countryCode)

  let body = `Hi, I'd like to ${action}.\n\n`
  body += `Country: ${country.flag} ${country.name}\n`
  body += `Name: ${name}\n`
  body += `Phone: ${phone}`

  if (paymentMethod) {
    const method = getPaymentMethod(paymentMethod)
    if (method) {
      body += `\nPayment Method: ${method.name}`
    }
  }

  const message = encodeURIComponent(body)
  return `https://wa.me/${number}?text=${message}`
}

export function buildQuickWhatsAppUrl(intent = 'contact', countryCode) {
  const code = countryCode || detectCountryCode()
  const number = getWhatsAppNumber(code)
  const body = quickMessages[intent] || quickMessages.contact
  return `https://wa.me/${number}?text=${encodeURIComponent(body)}`
}

export function buildCustomWhatsAppUrl(text, countryCode) {
  const code = countryCode || detectCountryCode()
  const number = getWhatsAppNumber(code)
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function buildSupportWhatsAppUrl(text) {
  const number = getSupportWhatsAppNumber()
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function openWhatsApp({ name, phone, intent = 'register', countryCode = 'PK', paymentMethod }) {
  window.open(
    buildWhatsAppUrl({ name, phone, intent, countryCode, paymentMethod }),
    '_blank',
    'noopener,noreferrer'
  )
}

export function openQuickWhatsApp(intent = 'contact') {
  window.open(buildQuickWhatsAppUrl(intent), '_blank', 'noopener,noreferrer')
}

export function openCustomWhatsApp(text) {
  window.open(buildCustomWhatsAppUrl(text), '_blank', 'noopener,noreferrer')
}

export function openSupportWhatsApp(text) {
  window.open(buildSupportWhatsAppUrl(text), '_blank', 'noopener,noreferrer')
}
