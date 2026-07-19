export const blogCategories = [
  { id: 'all', label: 'All Posts' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'guides', label: 'Guides' },
  { id: 'payments', label: 'Payments' },
  { id: 'tips', label: 'Tips' },
]

export const blogPosts = [
  {
    slug: 'cricket-betting-guide-beginners',
    title: 'Cricket Betting Guide for Beginners — Everything You Need to Know',
    excerpt:
      'New to cricket betting? Learn match odds, toss markets, bookmaker bets and how to place your first bet through your BpxPro agent.',
    category: 'guides',
    categoryLabel: 'Guides',
    author: 'BpxPro Team',
    date: '2026-06-20',
    readTime: '6 min read',
    featured: true,
    gradient: 'from-green-600/40 to-navy-light',
    emoji: '🏏',
    content: [
      {
        type: 'p',
        text: 'Cricket is the most popular sport for betting in Pakistan, India and across South Asia. Whether it\'s a T20 blast, an ODI series or a Test match, BpxPro gives you access to the best back and lay odds through your personal WhatsApp agent.',
      },
      {
        type: 'h2',
        text: 'Understanding Match Odds',
      },
      {
        type: 'p',
        text: 'Match odds are the simplest market — you bet on which team will win. On an exchange, you can BACK a team (bet they will win) or LAY a team (bet they will lose). Back odds appear in blue, lay odds in pink — just like on the BpxPro dashboard.',
      },
      {
        type: 'h2',
        text: 'Toss Market',
      },
      {
        type: 'p',
        text: 'The toss market lets you bet on which captain wins the coin toss. In T20 and ODI cricket, the toss can significantly affect the outcome — especially on dew-affected pitches in the evening. Your agent can place toss bets instantly before the match starts.',
      },
      {
        type: 'h2',
        text: 'Bookmaker Markets',
      },
      {
        type: 'p',
        text: 'Bookmaker markets offer fixed odds set by the bookmaker rather than peer-to-peer exchange odds. These are popular for session runs, top batsman and man of the match bets. Ask your agent about available bookmaker markets for any live match.',
      },
      {
        type: 'h2',
        text: 'How to Place Your First Bet',
      },
      {
        type: 'ol',
        items: [
          'Register on WhatsApp via BpxPro and select your country.',
          'Add balance using JazzCash, EasyPaisa, bank transfer or crypto.',
          'Message your agent with the match, market and stake amount.',
          'Confirm the bet — your agent places it and sends confirmation.',
        ],
      },
      {
        type: 'p',
        text: 'Start with small stakes while you learn the markets. Your agent is available 24/7 to explain any market or help you read the odds board.',
      },
    ],
  },
  {
    slug: 'jazzcash-easypaisa-deposit-guide',
    title: 'JazzCash vs EasyPaisa — Fastest Way to Add Balance on BpxPro',
    excerpt:
      'Compare JazzCash and EasyPaisa deposits. Step-by-step guide to topping up your betting account in under 2 minutes.',
    category: 'payments',
    categoryLabel: 'Payments',
    author: 'BpxPro Team',
    date: '2026-06-18',
    readTime: '4 min read',
    featured: false,
    gradient: 'from-red-600/30 to-navy-light',
    emoji: '💳',
    content: [
      {
        type: 'p',
        text: 'Adding balance on BpxPro is quick and secure. For Pakistani users, JazzCash and EasyPaisa are the two most popular options — both process deposits in around 2 minutes through your WhatsApp agent.',
      },
      {
        type: 'h2',
        text: 'JazzCash Deposits',
      },
      {
        type: 'p',
        text: 'JazzCash is ideal if you already use Jazz or Warid. Minimum deposit is Rs. 500. Tap "Add Balance" on BpxPro, select JazzCash, choose Pakistan as your country and message your agent on WhatsApp. They will share the JazzCash account number — send the amount and share the transaction screenshot. Balance is added within 2 minutes after verification.',
      },
      {
        type: 'h2',
        text: 'EasyPaisa Deposits',
      },
      {
        type: 'p',
        text: 'EasyPaisa works the same way and is popular with Telenor and Zong users. The process is identical: select EasyPaisa, contact your agent, transfer funds and share proof. Most EasyPaisa deposits are confirmed in under 2 minutes during peak hours.',
      },
      {
        type: 'h2',
        text: 'Which Should You Choose?',
      },
      {
        type: 'ul',
        items: [
          'Use JazzCash if you have a JazzCash wallet with active balance.',
          'Use EasyPaisa if that\'s your primary mobile wallet.',
          'Both support instant withdrawals — ask your agent when you win.',
          'For larger amounts (Rs. 50,000+), bank transfer may be more convenient.',
        ],
      },
      {
        type: 'p',
        text: 'Never send money to unverified numbers. Always deposit through your official BpxPro WhatsApp agent who registered your account.',
      },
    ],
  },
  {
    slug: 'back-and-lay-betting-explained',
    title: 'Back & Lay Betting Explained — How Exchange Betting Works',
    excerpt:
      'What is back betting? What is lay betting? A simple guide to understanding exchange odds and why they beat traditional bookmakers.',
    category: 'guides',
    categoryLabel: 'Guides',
    author: 'Ahmed K.',
    date: '2026-06-15',
    readTime: '5 min read',
    featured: false,
    gradient: 'from-blue-600/30 to-navy-light',
    emoji: '📊',
    content: [
      {
        type: 'p',
        text: 'Exchange betting is different from traditional bookmaker betting. Instead of betting against the house, you bet against other players — and BpxPro connects you through your agent to the best exchange odds available.',
      },
      {
        type: 'h2',
        text: 'What is Back Betting?',
      },
      {
        type: 'p',
        text: 'Backing means you are betting FOR an outcome to happen. If you back Pakistan at 1.85, you win if Pakistan wins. The blue columns on the BpxPro odds board show back prices. Higher back odds mean higher potential profit but lower implied probability.',
      },
      {
        type: 'h2',
        text: 'What is Lay Betting?',
      },
      {
        type: 'p',
        text: 'Laying means you are betting AGAINST an outcome — acting as the bookmaker. If you lay India at 2.10, you win if India loses or draws. The pink columns show lay prices. Lay betting is powerful for trading positions during live matches.',
      },
      {
        type: 'h2',
        text: 'Why Exchange Odds Are Better',
      },
      {
        type: 'ul',
        items: [
          'No bookmaker margin — you get true market odds.',
          'You can trade in-play — lock profit or cut losses mid-match.',
          'Lay betting opens strategies not available at traditional bookies.',
          'Liquidity on major cricket matches often exceeds 1 million.',
        ],
      },
      {
        type: 'p',
        text: 'Your BpxPro agent handles all the technical side. Just tell them what you want to back or lay and at what stake — they execute instantly on the exchange.',
      },
    ],
  },
  {
    slug: 'psl-2026-betting-tips',
    title: 'PSL 2026 Betting Tips — Teams, Players & Markets to Watch',
    excerpt:
      'Our expert picks for PSL Season 11 — top teams, value bets, session markets and in-play strategies for maximum profit.',
    category: 'cricket',
    categoryLabel: 'Cricket',
    author: 'BpxPro Team',
    date: '2026-06-12',
    readTime: '7 min read',
    featured: false,
    gradient: 'from-purple-600/30 to-navy-light',
    emoji: '🏆',
    content: [
      {
        type: 'p',
        text: 'PSL 2026 is shaping up to be one of the most competitive seasons yet. With familiar franchises and new talent emerging, there are plenty of value betting opportunities across match odds, top batsman and session runs markets.',
      },
      {
        type: 'h2',
        text: 'Teams to Watch',
      },
      {
        type: 'p',
        text: 'Lahore Qalandars enter as defending champions with a strong bowling unit. Karachi Kings have rebuilt their squad around experienced internationals. Multan Sultans consistently perform well in the group stage — look for early-season value before odds shorten.',
      },
      {
        type: 'h2',
        text: 'Best Markets for PSL',
      },
      {
        type: 'ul',
        items: [
          'Match Odds — best liquidity, tightest spreads on all PSL games.',
          'Top Batsman — high variance but excellent odds on in-form players.',
          'Session Runs — popular for live betting during powerplay and death overs.',
          'Toss Market — critical on Karachi and Lahore pitches with dew factor.',
        ],
      },
      {
        type: 'h2',
        text: 'In-Play Strategy',
      },
      {
        type: 'p',
        text: 'PSL matches swing heavily during the middle overs. Watch for teams losing early wickets — their lay odds often spike, creating lay-back trading opportunities. Your BpxPro agent can execute in-play trades within seconds via WhatsApp.',
      },
      {
        type: 'p',
        text: 'Register now and add balance before the next PSL matchday to avoid missing opening odds.',
      },
    ],
  },
  {
    slug: 'install-flowexch-mobile-app',
    title: 'How to Install BpxPro on Your Phone — Android & iPhone Guide',
    excerpt:
      'Turn BpxPro into a native app on your home screen. Works on Android and iPhone without downloading from any app store.',
    category: 'guides',
    categoryLabel: 'Guides',
    author: 'BpxPro Team',
    date: '2026-06-10',
    readTime: '3 min read',
    featured: false,
    gradient: 'from-cyan-600/30 to-navy-light',
    emoji: '📱',
    content: [
      {
        type: 'p',
        text: 'BpxPro works as a Progressive Web App (PWA) — meaning you can install it directly on your phone\'s home screen and use it like a native app, without going through Google Play or the App Store.',
      },
      {
        type: 'h2',
        text: 'Android Installation',
      },
      {
        type: 'ol',
        items: [
          'Open bpexpro.com in Chrome browser.',
          'Tap the "Install App" banner at the bottom, or tap the three-dot menu.',
          'Select "Install App" or "Add to Home Screen".',
          'Confirm — the BpxPro icon appears on your home screen.',
        ],
      },
      {
        type: 'h2',
        text: 'iPhone Installation',
      },
      {
        type: 'ol',
        items: [
          'Open bpexpro.com in Safari (must be Safari, not Chrome).',
          'Tap the Share button at the bottom of the screen.',
          'Scroll down and tap "Add to Home Screen".',
          'Name it BpxPro and tap Add.',
        ],
      },
      {
        type: 'h2',
        text: 'Benefits of the App',
      },
      {
        type: 'ul',
        items: [
          'Full-screen experience — no browser address bar.',
          'Quick access from home screen — one tap to open.',
          'Bottom navigation bar for easy mobile betting.',
          'WhatsApp register and deposit work exactly the same.',
        ],
      },
    ],
  },
  {
    slug: 'responsible-betting-tips',
    title: 'Bet Responsibly — 7 Rules Every Smart Bettor Follows',
    excerpt:
      'Betting should be fun, not stressful. Learn bankroll management, setting limits and knowing when to stop.',
    category: 'tips',
    categoryLabel: 'Tips',
    author: 'BpxPro Team',
    date: '2026-06-08',
    readTime: '4 min read',
    featured: false,
    gradient: 'from-amber-600/30 to-navy-light',
    emoji: '🛡️',
    content: [
      {
        type: 'p',
        text: 'BpxPro is built for entertainment and profit — but only when you bet smart. Responsible betting means staying in control, managing your bankroll and never chasing losses.',
      },
      {
        type: 'h2',
        text: '7 Golden Rules',
      },
      {
        type: 'ol',
        items: [
          'Set a daily budget and never exceed it — treat it like entertainment spend.',
          'Never bet money you cannot afford to lose — rent and bills come first.',
          'Don\'t chase losses — if you\'re on a bad run, take a break.',
          'Keep records of your bets — your agent can share your betting history.',
          'Avoid betting when emotional — angry or drunk betting leads to bad decisions.',
          'Take regular breaks — especially during long Test match sessions.',
          'Use the 18+ rule seriously — BpxPro is for adults only.',
        ],
      },
      {
        type: 'h2',
        text: 'Bankroll Management',
      },
      {
        type: 'p',
        text: 'Professional bettors never stake more than 2-5% of their total bankroll on a single bet. If your balance is Rs. 10,000, a single bet should be Rs. 200-500 maximum. This protects you from losing streaks and keeps you in the game long-term.',
      },
      {
        type: 'p',
        text: 'If you feel betting is becoming a problem, contact your agent to set deposit limits or take a self-exclusion break. We support responsible gambling across all 6 countries we serve.',
      },
    ],
  },
  {
    slug: 'crypto-deposit-usdt-guide',
    title: 'How to Deposit with Crypto (USDT) on BpxPro — Global Guide',
    excerpt:
      'Deposit using USDT or Bitcoin from any country. Perfect for UAE, UK and international players who prefer crypto payments.',
    category: 'payments',
    categoryLabel: 'Payments',
    author: 'Omar H.',
    date: '2026-06-05',
    readTime: '5 min read',
    featured: false,
    gradient: 'from-orange-600/30 to-navy-light',
    emoji: '₿',
    content: [
      {
        type: 'p',
        text: 'Crypto deposits are available for all BpxPro users regardless of country. USDT (Tether) on TRC-20 network is the most popular option — fast, low fees and stable value pegged to the US dollar.',
      },
      {
        type: 'h2',
        text: 'Why Use Crypto?',
      },
      {
        type: 'ul',
        items: [
          'Works from any country — UAE, UK, Saudi Arabia, Pakistan and more.',
          '24/7 processing — no bank hours restrictions.',
          'Minimum deposit just $10 equivalent.',
          'Fast withdrawals back to your crypto wallet.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Deposit USDT',
      },
      {
        type: 'ol',
        items: [
          'Tap "Add Balance" → select Crypto (USDT) on BpxPro.',
          'Choose your country and contact your WhatsApp agent.',
          'Agent shares the USDT TRC-20 wallet address.',
          'Send USDT from Binance, Trust Wallet or any exchange.',
          'Share the transaction hash — balance added in ~10 minutes.',
        ],
      },
      {
        type: 'h2',
        text: 'Important Notes',
      },
      {
        type: 'p',
        text: 'Always use TRC-20 network unless your agent specifies otherwise. Sending on the wrong network may result in lost funds. Double-check the wallet address character by character before sending.',
      },
    ],
  },
]

export function getPostBySlug(slug) {
  return blogPosts.find((p) => p.slug === slug)
}

export function getFeaturedPost() {
  return blogPosts.find((p) => p.featured) ?? blogPosts[0]
}

export function getPostsByCategory(category) {
  if (!category || category === 'all') return blogPosts
  return blogPosts.filter((p) => p.category === category)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
