const BRAND_ALIAS_TEXT = 'BPX, BPEXCH, BPXPRO, BettPro and Bett Pro'

export const DEFAULT_BRAND_GUIDE_SLUG = 'bpx'

export const BRAND_GUIDE_LEGACY_SLUGS = ['bpxpro', 'bettpro', 'bett-pro']

export const DEFAULT_BRAND_GUIDE_CONTENT = {
  slug: DEFAULT_BRAND_GUIDE_SLUG,
  redirectSlugs: [],
  seo: {
    metaTitle: 'BpxPro, BPX, BPEXCH & BettPro | Official Brand Names',
    metaDescription:
      'BpxPro is also searched as BPX, BPEXCH, BPXPRO, BettPro and Bett Pro. Same official betting exchange platform, same WhatsApp agents and same dashboard access.',
    metaKeywords: 'BpxPro, BPX, BPEXCH, BPXPRO, BettPro, Bett Pro, brand guide, betting exchange',
  },
  hero: {
    badge: 'Official Brand Guide',
    headline: 'BpxPro, BPX, BPEXCH, BPXPRO, BettPro & Bett Pro',
    intro:
      'If you searched for BPX, BPEXCH, BPXPRO, BettPro and Bett Pro, you are looking for the same official platform. BpxPro is the main brand, and these names all point to the same betting exchange, WhatsApp agent service and dashboard experience.',
    aliases: ['BPX', 'BPEXCH', 'BPXPRO', 'BettPro', 'Bett Pro'],
  },
  aliasCards: [
    {
      alias: 'BPX',
      note: 'Short brand version commonly typed in chats, direct searches and quick referrals.',
    },
    {
      alias: 'BPEXCH',
      note: 'Exchange-style shortcut that players often search when looking for the dashboard or login.',
    },
    {
      alias: 'BettPro',
      note: 'A spelling variation some users use when searching for the same betting platform.',
    },
  ],
  platform: {
    badge: 'Same Platform',
    title: 'What these names actually mean',
    body: `Users often search different brand spellings before they reach the right site. On this project, BpxPro is the main public brand and the aliases ${BRAND_ALIAS_TEXT} are treated as the same platform identity.`,
    highlights: [
      'Same official platform, same WhatsApp agents, same betting exchange access.',
      'Cricket, football, tennis, live casino and fast local payment options.',
      'Direct routes for registration, app download and dashboard access.',
    ],
  },
  links: {
    badge: 'Next Steps',
    title: 'Useful links',
    items: [
      {
        label: 'Read the full BPX / BPEXCH / BettPro brand guide',
        path: '/blog/bpx-bpexch-bettpro-brand-guide',
      },
      {
        label: 'Explore all betting guides and payment posts',
        path: '/blog',
      },
      {
        label: 'Go to homepage FAQ and support section',
        path: '/#faq',
      },
    ],
  },
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

export function normalizeBrandGuideSlug(value, fallback = DEFAULT_BRAND_GUIDE_SLUG) {
  const next = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return next || fallback
}

export function getBrandGuidePath(content) {
  return `/${normalizeBrandGuideSlug(content?.slug)}`
}

export function normalizeBrandGuideContent(raw) {
  const input = asObject(raw, {})
  const seoIn = asObject(input.seo, {})
  const heroIn = asObject(input.hero, {})
  const platformIn = asObject(input.platform, {})
  const linksIn = asObject(input.links, {})
  const defaults = DEFAULT_BRAND_GUIDE_CONTENT

  const aliases = asArray(heroIn.aliases, defaults.hero.aliases)
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const aliasCards = asArray(input.aliasCards, defaults.aliasCards)
    .map((item) => ({
      alias: String(item?.alias || '').trim(),
      note: String(item?.note || '').trim(),
    }))
    .filter((item) => item.alias || item.note)

  const highlights = asArray(platformIn.highlights, defaults.platform.highlights)
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const linkItems = asArray(linksIn.items, defaults.links.items)
    .map((item) => ({
      label: String(item?.label || '').trim(),
      path: String(item?.path || item?.to || '').trim(),
    }))
    .filter((item) => item.label && item.path)

  const redirectSlugs = asArray(input.redirectSlugs, defaults.redirectSlugs)
    .map((item) => normalizeBrandGuideSlug(item, ''))
    .filter(Boolean)

  const slug = normalizeBrandGuideSlug(input.slug, defaults.slug)
  const redirectSet = new Set(redirectSlugs.filter((item) => item !== slug))

  return {
    slug,
    redirectSlugs: [...redirectSet],
    seo: {
      metaTitle: mergeString(seoIn.metaTitle, defaults.seo.metaTitle),
      metaDescription: mergeString(seoIn.metaDescription, defaults.seo.metaDescription),
      metaKeywords: mergeString(seoIn.metaKeywords, defaults.seo.metaKeywords),
    },
    hero: {
      badge: mergeString(heroIn.badge, defaults.hero.badge),
      headline: mergeString(heroIn.headline, defaults.hero.headline),
      intro: mergeString(heroIn.intro, defaults.hero.intro),
      aliases: aliases.length ? aliases : defaults.hero.aliases,
    },
    aliasCards: aliasCards.length ? aliasCards : defaults.aliasCards,
    platform: {
      badge: mergeString(platformIn.badge, defaults.platform.badge),
      title: mergeString(platformIn.title, defaults.platform.title),
      body: mergeString(platformIn.body, defaults.platform.body),
      highlights: highlights.length ? highlights : defaults.platform.highlights,
    },
    links: {
      badge: mergeString(linksIn.badge, defaults.links.badge),
      title: mergeString(linksIn.title, defaults.links.title),
      items: linkItems.length ? linkItems : defaults.links.items,
    },
  }
}
