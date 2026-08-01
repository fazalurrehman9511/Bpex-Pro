const BRAND_ALIAS_TEXT = 'BPX, BPEXCH, BPXPRO, BettPro and Bett Pro'

export const DEFAULT_HOMEPAGE_CONTENT = {
  seo: {
    metaTitle: 'BpxPro (BPX / BPEXCH) | Asia Betting Exchange & Cricket Odds',
    metaDescription:
      "BpxPro, also searched as BPX, BPEXCH, BettPro and Bett Pro, is Asia's trusted betting exchange agent for cricket, football, tennis and live casino.",
    metaKeywords:
      'BpxPro, BPX, BPEXCH, BPXPRO, Bett Pro, BettPro, BPEX Pro, Asia betting exchange, cricket betting Asia, JazzCash deposit, EasyPaisa betting, WhatsApp betting agent, live odds Asia',
  },
  hero: {
    badgeLive: 'LIVE — Markets Open',
    badgeCountries: '4 Countries · Local Agents',
    headlinePrefix: "Asia's #1",
    headlineAccent: 'Betting Exchange',
    subtitle:
      'Cricket, Football, Tennis, Horse Racing & Live Casino — best odds with your personal agent on WhatsApp. Register in 60 seconds.',
    highlights: [
      'Trusted agent since 2018',
      '5 min avg payout speed',
      '24/7 WhatsApp support',
      'Self-register in 60 seconds',
    ],
    ctaAgent: 'Register with Agent',
    ctaSelf: 'Register Myself',
  },
  stats: [
    { value: '15,000+', label: 'Active Users' },
    { value: '5 Min', label: 'Avg Payout' },
    { value: '6', label: 'Countries' },
    { value: '24/7', label: 'WhatsApp Support' },
  ],
  howItWorks: {
    title: 'How It Works',
    subtitle: 'Get started in 3 simple steps',
    steps: [
      {
        title: 'Register on WhatsApp',
        desc: 'Select your country, enter name & phone — connected to your local agent instantly.',
      },
      {
        title: 'Add Balance',
        desc: 'Deposit via JazzCash, EasyPaisa, Bank Transfer or Crypto. Funds added in minutes.',
      },
      {
        title: 'Start Betting',
        desc: 'Place bets on cricket, football, tennis, casino & more through your agent.',
      },
    ],
  },
  features: {
    title: 'Why BpxPro?',
    items: [
      {
        title: '100% Secure',
        desc: 'Operating since 2018. Every transaction confirmed on WhatsApp with your personal agent.',
      },
      {
        title: 'Personal Agent',
        desc: 'Dedicated agent for bets, deposits, withdrawals and support — available 24/7.',
      },
      {
        title: 'Best Odds',
        desc: 'Top back & lay rates on cricket, football, tennis, horse racing and live casino.',
      },
      {
        title: 'Mobile Ready',
        desc: 'Works on any phone. Install as app or use in browser — same experience.',
      },
    ],
  },
  testimonials: {
    title: 'What Players Say',
    subtitle: 'Trusted by thousands across 6 countries',
    items: [
      {
        name: 'Ahmed K.',
        country: '🇵🇰 Pakistan',
        text: 'Best agent in Karachi. JazzCash deposit in 2 minutes, withdrawal same day. Highly recommended!',
        rating: 5,
      },
      {
        name: 'Rajesh M.',
        country: '🇮🇳 India',
        text: 'Cricket odds are always better than others. Agent replies instantly on WhatsApp even at 2 AM.',
        rating: 5,
      },
      {
        name: 'Omar H.',
        country: '🇦🇪 UAE',
        text: 'Professional service. Bank transfer deposit was smooth. Been using BpxPro for 2 years now.',
        rating: 5,
      },
    ],
  },
  faq: {
    title: 'FAQ',
    subtitle: 'Common questions answered',
    supportTitle: 'Still have questions?',
    supportText: 'Chat with BpxPro Support on WhatsApp',
    supportCta: 'Contact Support',
    items: [
      {
        q: 'How do I register?',
        a: 'Two ways: (1) Create Myself — pick username/password on the site and your BPEXCH account is created instantly. (2) WhatsApp Agent — message your local agent and they set up your account.',
      },
      {
        q: 'How can I add balance?',
        a: 'Choose JazzCash, EasyPaisa, Bank Transfer or Crypto from the Add Balance section. Your country agent will share account details and confirm your deposit on WhatsApp.',
      },
      {
        q: 'Which countries are supported?',
        a: 'We have dedicated agents across Asia, plus support for users in the UAE, Saudi Arabia and the United Kingdom. Select your country during registration to connect with the right agent.',
      },
      {
        q: 'Is BpxPro the same as BPX, BPEXCH or BettPro?',
        a: `Yes. BpxPro is also searched as ${BRAND_ALIAS_TEXT}. They all refer to the same betting exchange platform and WhatsApp agent service.`,
      },
      {
        q: 'How fast are withdrawals?',
        a: 'Most withdrawals are processed within 5–15 minutes via JazzCash, EasyPaisa or bank transfer. Crypto withdrawals may take up to 30 minutes.',
      },
      {
        q: 'Is my money safe?',
        a: 'BpxPro has been operating since 2018 with 15,000+ active users. Every transaction is handled personally by your assigned agent with full WhatsApp confirmation.',
      },
    ],
  },
  footer: {
    tagline:
      "Asia's trusted betting exchange agent. Cricket, Casino, Sports — with 24/7 WhatsApp support.",
    social: {
      facebook: '',
      instagram: '',
      x: '',
      youtube: '',
      telegram: '',
      tiktok: '',
    },
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

function normalizeSocial(raw, defaults) {
  const input = asObject(raw, {})
  return {
    facebook: normalizeSocialUrl(input.facebook ?? defaults.facebook ?? ''),
    instagram: normalizeSocialUrl(input.instagram ?? defaults.instagram ?? ''),
    x: normalizeSocialUrl(input.x ?? defaults.x ?? ''),
    youtube: normalizeSocialUrl(input.youtube ?? defaults.youtube ?? ''),
    telegram: normalizeSocialUrl(input.telegram ?? defaults.telegram ?? ''),
    tiktok: normalizeSocialUrl(input.tiktok ?? defaults.tiktok ?? ''),
  }
}

function normalizeSocialUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`
  return `https://${trimmed}`
}

export function normalizeHomepageContent(raw) {
  const input = asObject(raw, {})
  const heroIn = asObject(input.hero, {})
  const howIn = asObject(input.howItWorks, {})
  const featuresIn = asObject(input.features, {})
  const testimonialsIn = asObject(input.testimonials, {})
  const faqIn = asObject(input.faq, {})
  const footerIn = asObject(input.footer, {})
  const seoIn = asObject(input.seo, {})
  const defaults = DEFAULT_HOMEPAGE_CONTENT

  const highlights = asArray(heroIn.highlights, defaults.hero.highlights)
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  const stats = asArray(input.stats, defaults.stats)
    .map((item) => ({
      value: String(item?.value || '').trim(),
      label: String(item?.label || '').trim(),
    }))
    .filter((item) => item.value || item.label)
  const steps = asArray(howIn.steps, defaults.howItWorks.steps)
    .map((item) => ({
      title: String(item?.title || '').trim(),
      desc: String(item?.desc || '').trim(),
    }))
    .filter((item) => item.title || item.desc)
  const featureItems = asArray(featuresIn.items, defaults.features.items)
    .map((item) => ({
      title: String(item?.title || '').trim(),
      desc: String(item?.desc || '').trim(),
    }))
    .filter((item) => item.title || item.desc)
  const testimonialItems = asArray(testimonialsIn.items, defaults.testimonials.items)
    .map((item) => ({
      name: String(item?.name || '').trim(),
      country: String(item?.country || '').trim(),
      text: String(item?.text || '').trim(),
      rating: Math.min(5, Math.max(1, Number(item?.rating) || 5)),
    }))
    .filter((item) => item.name || item.text)
  const faqItems = asArray(faqIn.items, defaults.faq.items)
    .map((item) => ({
      q: String(item?.q || '').trim(),
      a: String(item?.a || '').trim(),
    }))
    .filter((item) => item.q || item.a)

  return {
    seo: {
      metaTitle: mergeString(seoIn.metaTitle, defaults.seo.metaTitle),
      metaDescription: mergeString(seoIn.metaDescription, defaults.seo.metaDescription),
      metaKeywords: mergeString(seoIn.metaKeywords, defaults.seo.metaKeywords),
    },
    hero: {
      badgeLive: mergeString(heroIn.badgeLive, defaults.hero.badgeLive),
      badgeCountries: mergeString(heroIn.badgeCountries, defaults.hero.badgeCountries),
      headlinePrefix: mergeString(heroIn.headlinePrefix, defaults.hero.headlinePrefix),
      headlineAccent: mergeString(heroIn.headlineAccent, defaults.hero.headlineAccent),
      subtitle: mergeString(heroIn.subtitle, defaults.hero.subtitle),
      highlights: highlights.length ? highlights : defaults.hero.highlights,
      ctaAgent: mergeString(heroIn.ctaAgent, defaults.hero.ctaAgent),
      ctaSelf: mergeString(heroIn.ctaSelf, defaults.hero.ctaSelf),
    },
    stats: stats.length ? stats : defaults.stats,
    howItWorks: {
      title: mergeString(howIn.title, defaults.howItWorks.title),
      subtitle: mergeString(howIn.subtitle, defaults.howItWorks.subtitle),
      steps: steps.length ? steps : defaults.howItWorks.steps,
    },
    features: {
      title: mergeString(featuresIn.title, defaults.features.title),
      items: featureItems.length ? featureItems : defaults.features.items,
    },
    testimonials: {
      title: mergeString(testimonialsIn.title, defaults.testimonials.title),
      subtitle: mergeString(testimonialsIn.subtitle, defaults.testimonials.subtitle),
      items: testimonialItems.length ? testimonialItems : defaults.testimonials.items,
    },
    faq: {
      title: mergeString(faqIn.title, defaults.faq.title),
      subtitle: mergeString(faqIn.subtitle, defaults.faq.subtitle),
      supportTitle: mergeString(faqIn.supportTitle, defaults.faq.supportTitle),
      supportText: mergeString(faqIn.supportText, defaults.faq.supportText),
      supportCta: mergeString(faqIn.supportCta, defaults.faq.supportCta),
      items: faqItems.length ? faqItems : defaults.faq.items,
    },
    footer: {
      tagline: mergeString(footerIn.tagline, defaults.footer.tagline),
      social: normalizeSocial(footerIn.social, defaults.footer.social),
    },
  }
}
