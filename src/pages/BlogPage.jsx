import { useEffect, useState } from 'react'
import { BookOpen, Search, Sparkles, MessageCircle, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ANDROID_APK_AVAILABLE, ANDROID_APK_URL } from '../config/androidApp'
import { useModal } from '../context/ModalContext'
import { blogCategories, blogPosts as staticPosts } from '../data/blogPosts'
import { fetchBlogPosts } from '../utils/api'
import { isBpexchLoggedIn, subscribeBpexchAuth } from '../utils/bpexchAuth'
import BlogCard from '../components/blog/BlogCard'
import { openBpexchLoginInNewTab } from '../utils/bpexchExternal'

export default function BlogPage() {
  const { openModal } = useModal()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState(staticPosts)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(() => isBpexchLoggedIn())

  const openDashboard = (e) => {
    if (openBpexchLoginInNewTab()) {
      e?.preventDefault?.()
    }
  }

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
    <div className="min-h-screen">
      <section className="hero-mesh relative overflow-hidden border-b border-emerald-200/60 px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12">

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  BpxPro Blog
                </span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Betting Tips, Guides &amp;{' '}
                <span className="text-gradient-brand">Expert Insights</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Cricket strategies, payment guides, PSL tips and everything you need to bet smarter on BpxPro.
              </p>
              {!loading && (
                <p className="mt-4 text-xs font-medium text-slate-500">
                  {posts.length} articles · Updated regularly
                </p>
              )}
            </div>

            <div className="w-full shrink-0 lg:max-w-sm">
              <label htmlFor="blog-search" className="mb-2 block text-xs font-semibold text-slate-600">
                Search articles
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="blog-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cricket, payments, tips…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[3.25rem] z-20 border-b border-emerald-200/60 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto scrollbar-hide">
          {blogCategories.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${
                activeCategory === id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          {loading && (
            <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              Loading articles…
            </div>
          )}

          {showFeatured && (
            <div className="mb-12">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Featured Article
                </h2>
              </div>
              <BlogCard post={featured} featured />
            </div>
          )}

          {gridPosts.length > 0 ? (
            <div>
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {search ? `Results for “${search}”` : 'Latest Articles'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {gridPosts.length} {gridPosts.length === 1 ? 'article' : 'articles'}
                    {activeCategory !== 'all' &&
                      ` in ${blogCategories.find((c) => c.id === activeCategory)?.label}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-900">No articles found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search term or category.
              </p>
              {(search || activeCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveCategory('all')
                  }}
                  className="mt-5 cursor-pointer text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : null}

          <div className="mt-16 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left sm:px-10 sm:py-12">
              <div className="max-w-md">
                <p className="text-lg font-bold text-slate-900 sm:text-xl">Ready to Start Betting?</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Register with Agent on WhatsApp, or create your account yourself — free setup.
                </p>
              </div>
              {loggedIn ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Link
                    to="/dashboard"
                    onClick={openDashboard}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
                  >
                    Open Dashboard
                  </Link>
                  {ANDROID_APK_AVAILABLE && (
                    <a
                      href={ANDROID_APK_URL}
                      download
                      aria-label="Download Android app"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-slate-400"
                    >
                      <Download className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      Download App
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                    Register with Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('register', { registerPath: 'self' })}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                  >
                    Register Myself
                  </button>
                  {ANDROID_APK_AVAILABLE && (
                    <a
                      href={ANDROID_APK_URL}
                      download
                      aria-label="Download Android app"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-slate-400"
                    >
                      <Download className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      Download App
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
