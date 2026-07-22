import { useEffect, useState } from 'react'
import { BookOpen, Search, Sparkles, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { blogCategories, blogPosts as staticPosts } from '../data/blogPosts'
import { fetchBlogPosts } from '../utils/api'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import BlogCard from '../components/blog/BlogCard'

export default function BlogPage() {
  const { openModal } = useModal()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState(staticPosts)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  useEffect(() => subscribeBpexchAuth(setLoggedIn), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchBlogPosts(activeCategory)
      .then((list) => {
        if (!cancelled && list?.length) setPosts(list)
      })
      .catch(() => {
        if (!cancelled) setPosts(staticPosts)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [activeCategory])

  const featured = posts.find((p) => p.featured) ?? posts[0]
  const filtered = posts.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase())
  )
  const gridPosts = filtered.filter((p) => {
    if (search || activeCategory !== 'all') return true
    return p.slug !== featured?.slug
  })
  const showFeatured = !search && activeCategory === 'all' && featured

  return (
    <div className="min-h-screen bg-navy">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border px-4 pt-10 pb-10 sm:px-6 sm:pt-14 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,211,102,0.14)_0%,_transparent_55%)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-header-blue/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  BpxPro Blog
                </span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text sm:text-4xl lg:text-[2.75rem]">
                Betting Tips, Guides &amp;{' '}
                <span className="text-accent">Expert Insights</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Cricket strategies, payment guides, PSL tips and everything you need to bet smarter on BpxPro.
              </p>
              {!loading && (
                <p className="mt-4 text-xs font-medium text-muted/80">
                  {posts.length} articles · Updated regularly
                </p>
              )}
            </div>

            <div className="w-full shrink-0 lg:max-w-sm">
              <label htmlFor="blog-search" className="mb-2 block text-xs font-semibold text-muted">
                Search articles
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="blog-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cricket, payments, tips…"
                  className="w-full rounded-xl border border-border bg-navy-light py-3 pl-10 pr-4 text-sm text-text shadow-inner placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="sticky top-0 z-20 border-b border-border bg-navy/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto scrollbar-hide">
          {blogCategories.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activeCategory === id
                  ? 'bg-accent text-navy-dark shadow-md shadow-accent/20'
                  : 'border border-border bg-navy-light text-muted hover:border-accent/30 hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {loading && (
            <div className="mb-8 flex items-center gap-2 text-sm text-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Loading articles…
            </div>
          )}

          {showFeatured && (
            <div className="mb-12">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Featured Article
                </h2>
              </div>
              <BlogCard post={featured} featured />
            </div>
          )}

          {gridPosts.length > 0 ? (
            <div>
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text sm:text-xl">
                    {search ? `Results for “${search}”` : 'Latest Articles'}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {gridPosts.length} {gridPosts.length === 1 ? 'article' : 'articles'}
                    {activeCategory !== 'all' &&
                      ` in ${blogCategories.find((c) => c.id === activeCategory)?.label}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-navy-light/50 py-20 text-center">
              <Search className="mx-auto h-10 w-10 text-muted/30" />
              <p className="mt-4 text-base font-semibold text-text">No articles found</p>
              <p className="mt-1 text-sm text-muted">
                Try a different search term or category.
              </p>
              {(search || activeCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveCategory('all')
                  }}
                  className="mt-5 text-sm font-semibold text-accent hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : null}

          {/* CTA */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-navy-light to-navy-light">
            <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left sm:px-10 sm:py-12">
              <div className="max-w-md">
                <p className="text-lg font-bold text-text sm:text-xl">Ready to Start Betting?</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Register with Agent on WhatsApp, or create your account yourself — free setup.
                </p>
              </div>
              {loggedIn ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Link
                    to="/dashboard"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
                  >
                    Open Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                    className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-navy-dark shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
                  >
                    <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                    Register with Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'self' })}
                    className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-navy-dark px-6 py-3.5 text-sm font-bold text-text transition-colors hover:border-accent/40"
                  >
                    Register Myself
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
