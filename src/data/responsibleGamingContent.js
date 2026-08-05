import { fetchResponsibleGamingContent } from '../utils/api'

export const DEFAULT_RESPONSIBLE_GAMING_CONTENT = {
  seo: {
    metaTitle: 'Responsible Gaming | BpxPro',
    metaDescription:
      'BpxPro encourages responsible gaming. Learn about safe betting limits, age restrictions, self-control tips and support resources.',
    metaKeywords: 'BpxPro, responsible gaming, responsible gambling, betting limits, safe betting',
  },
  page: {
    badge: 'Responsible Gaming',
    title: 'Responsible Gaming',
    intro:
      'At BpxPro, we encourage responsible gaming and believe that betting should always be treated as a form of entertainment. Our goal is to help users access the platform while promoting safe and responsible participation in online betting activities.',
    lastUpdated: 'August 2026',
  },
  sections: [
    {
      title: 'Introduction',
      paragraphs: [
        'At BpxPro, we encourage responsible gaming and believe that betting should always be treated as a form of entertainment. Our goal is to help users create accounts and access betting services while promoting safe and responsible participation in online betting activities.',
      ],
      bullets: [],
    },
    {
      title: 'Gambling as Entertainment',
      paragraphs: [
        'Online betting should be viewed as a recreational activity and not as a way to generate income. Players should only wager amounts they are comfortable losing and avoid making financial decisions based on betting outcomes.',
      ],
      bullets: [],
    },
    {
      title: 'Play Within Your Limits',
      paragraphs: [
        'Responsible gaming means setting personal limits for both time and money spent on betting activities. Users should always maintain control over their betting habits and avoid excessive gambling.',
        'Helpful tips include:',
      ],
      bullets: [
        'Set a fixed budget before placing bets',
        'Avoid chasing losses',
        'Take regular breaks from betting',
        'Balance betting with other activities',
      ],
    },
    {
      title: 'Age Restriction',
      paragraphs: [
        'Our services are strictly intended for individuals 18 years of age or older. We do not knowingly provide services to minors, and we strongly discourage underage gambling.',
      ],
      bullets: [],
    },
    {
      title: 'Recognizing Gambling Problems',
      paragraphs: [
        'If betting starts affecting your finances, relationships, or daily responsibilities, it may be a sign that gambling is becoming a problem. In such situations, it is important to seek help and take a break from gambling activities.',
      ],
      bullets: [],
    },
    {
      title: 'Self-Control and Support',
      paragraphs: ['If you feel that gambling is becoming difficult to control, consider taking steps such as:'],
      bullets: [
        'Limiting your betting activity',
        'Taking extended breaks from betting platforms',
        'Seeking guidance from professional support organizations',
      ],
    },
    {
      title: 'Third-Party Platforms',
      paragraphs: [
        'BpxPro provides account registration, deposits, withdrawals and support coordination, but betting activities may take place on connected third-party platforms. Users are responsible for their own gaming decisions and activities on those platforms.',
      ],
      bullets: [],
    },
    {
      title: 'Contact Us',
      paragraphs: [
        'If you have any questions about responsible gaming or our services, you may contact us through the contact section on the homepage or via WhatsApp support.',
      ],
      bullets: [],
    },
  ],
}

function asArray(value, fallback) {
  return Array.isArray(value) ? value : fallback
}

function asObject(value, fallback) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

function mergeString(value, fallback) {
  const next = value == null ? '' : String(value)
  return next.trim() ? next : fallback
}

function normalizeSection(raw, fallback) {
  const input = asObject(raw, {})
  const paragraphs = asArray(input.paragraphs, fallback?.paragraphs || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  const bullets = asArray(input.bullets, fallback?.bullets || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  return {
    title: mergeString(input.title, fallback?.title || ''),
    paragraphs: paragraphs.length ? paragraphs : fallback?.paragraphs || [],
    bullets,
  }
}

export function normalizeResponsibleGamingContent(raw) {
  const input = asObject(raw, {})
  const seoIn = asObject(input.seo, {})
  const pageIn = asObject(input.page, {})
  const defaults = DEFAULT_RESPONSIBLE_GAMING_CONTENT

  const defaultSections = defaults.sections
  const sectionsIn = asArray(input.sections, defaultSections)
  const sections = sectionsIn
    .map((section, index) => normalizeSection(section, defaultSections[index] || defaultSections[0]))
    .filter((section) => section.title || section.paragraphs.length || section.bullets.length)

  return {
    seo: {
      metaTitle: mergeString(seoIn.metaTitle, defaults.seo.metaTitle),
      metaDescription: mergeString(seoIn.metaDescription, defaults.seo.metaDescription),
      metaKeywords: mergeString(seoIn.metaKeywords, defaults.seo.metaKeywords),
    },
    page: {
      badge: mergeString(pageIn.badge, defaults.page.badge),
      title: mergeString(pageIn.title, defaults.page.title),
      intro: mergeString(pageIn.intro, defaults.page.intro),
      lastUpdated: mergeString(pageIn.lastUpdated, defaults.page.lastUpdated),
    },
    sections: sections.length ? sections : defaults.sections,
  }
}

const STORAGE_KEY = 'flowexch.responsibleGaming.content.v1'

function loadCachedContent() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeResponsibleGamingContent(JSON.parse(raw))
  } catch {
    return null
  }
}

function saveCachedContent(content) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
  } catch {
    /* ignore */
  }
}

let contentCache =
  loadCachedContent() || normalizeResponsibleGamingContent(DEFAULT_RESPONSIBLE_GAMING_CONTENT)

export function getResponsibleGamingContent() {
  return contentCache
}

export function setResponsibleGamingContentCache(content) {
  contentCache = normalizeResponsibleGamingContent(content)
  saveCachedContent(contentCache)
  return contentCache
}

export async function loadResponsibleGamingContent() {
  try {
    const data = await fetchResponsibleGamingContent()
    setResponsibleGamingContentCache(data?.content || data)
  } catch (err) {
    console.warn('Responsible gaming content load failed, using defaults:', err.message)
  }
  return contentCache
}
