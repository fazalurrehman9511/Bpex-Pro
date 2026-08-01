import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { blogPosts as staticPosts, formatDate } from '../data/blogPosts'
import { fetchBlogPost, fetchBlogPosts } from '../utils/api'
import { useModal } from '../context/ModalContext'
import BlogContent from '../components/blog/BlogContent'
import BlogCard from '../components/blog/BlogCard'
import BlogCover, { getBlogCoverImage } from '../components/blog/BlogCover'
import SeoHead from '../components/SeoHead'
import SocialLinks from '../components/SocialLinks'
import { useHomepageContent } from '../context/HomepageContentContext'
import { SITE_URL } from '../config/brand'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { openModal } = useModal()
  const { footer } = useHomepageContent()
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [tocItems, setTocItems] = useState([])
  const [activeHeading, setActiveHeading] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setCopied(false)
    window.scrollTo({ top: 0, behavior: 'auto' })

    Promise.all([
      fetchBlogPost(slug).catch(() => staticPosts.find((p) => p.slug === slug) || null),
      fetchBlogPosts().catch(() => staticPosts),
    ])
      .then(([fetchedPost, allPosts]) => {
        if (cancelled) return
        if (!fetchedPost) {
          setNotFound(true)
          return
        }
        setPost(fetchedPost)
        const list = Array.isArray(allPosts) ? allPosts : staticPosts
        const related = list
          .filter((p) => p.slug !== fetchedPost.slug && p.category === fetchedPost.category)
          .slice(0, 3)
        const fallback = list.filter((p) => p.slug !== fetchedPost.slug).slice(0, 3)
        setRelatedPosts(related.length > 0 ? related : fallback)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    const updateProgress = () => {
      const article = document.getElementById('blog-article')
      if (!article) return
      const start = article.offsetTop
      const distance = Math.max(article.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100))
      setReadingProgress(progress)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [post])

  useEffect(() => {
    let observer
    const timer = window.setTimeout(() => {
      const headings = Array.from(
        document.querySelectorAll('#article-content h2, #article-content h3'),
      )

      const items = headings.map((heading, index) => {
        const baseId = String(heading.textContent || `section-${index + 1}`)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        const id = heading.id || baseId || `section-${index + 1}`
        heading.id = id
        return {
          id,
          label: heading.textContent?.trim() || `Section ${index + 1}`,
          level: heading.tagName === 'H3' ? 3 : 2,
        }
      })

      setTocItems(items)
      setActiveHeading(items[0]?.id || '')

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((entry) => entry.isIntersecting)
          if (visible) setActiveHeading(visible.target.id)
        },
        { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
      )
      headings.forEach((heading) => observer.observe(heading))
    }, 0)

    return () => {
      window.clearTimeout(timer)
      observer?.disconnect()
    }
  }, [post])

  if (notFound) return <Navigate to="/blog" replace />

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="mt-10 h-5 w-24 rounded-full bg-slate-200" />
          <div className="mt-5 h-10 max-w-2xl rounded bg-slate-200 sm:h-14" />
          <div className="mt-3 h-10 max-w-xl rounded bg-slate-100" />
          <div className="mt-8 h-16 max-w-md rounded bg-slate-200" />
          <div className="mt-12 h-96 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if (err?.name !== 'AbortError') console.warn('Article share failed:', err)
    }
  }

  const seoTitle = post.metaTitle || `${post.title} | BpxPro Blog`
  const seoDescription = post.metaDescription || post.excerpt
  const seoKeywords = post.metaKeywords || ''
  const coverImage = getBlogCoverImage(post)

  return (
    <div className="min-h-screen bg-slate-50">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={`/blog/${post.slug}`}
        ogTitle={post.metaTitle || post.title}
        ogDescription={seoDescription}
        twitterTitle={post.metaTitle || post.title}
        twitterDescription={seoDescription}
        ogImage={coverImage || undefined}
        ogType="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: seoDescription,
          keywords: seoKeywords || undefined,
          datePublished: post.date,
          author: {
            '@type': 'Person',
            name: post.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'BpxPro',
          },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          url: `${SITE_URL}/blog/${post.slug}`,
        }}
      />

      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-slate-200">
        <div
          className="h-full bg-emerald-600 transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <header className="hero-mesh border-b border-emerald-200/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500"
          >
            <Link to="/" className="transition-colors hover:text-emerald-700">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="transition-colors hover:text-emerald-700">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-700">{post.categoryLabel}</span>
          </nav>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  {post.categoryLabel}
                </span>
                {post.featured && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                {post.excerpt}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-extrabold text-emerald-700">
                    {post.author?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{post.author}</p>
                    <p className="text-xs text-slate-500">BpxPro contributor</p>
                  </div>
                </div>
                <span className="hidden h-8 w-px bg-slate-200 sm:block" />
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  {post.readTime}
                </span>
              </div>
            </div>

            {coverImage ? (
              <div className="hidden h-36 w-36 overflow-hidden rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/5 lg:block">
                <BlogCover post={post} variant="hero-thumb" title={post.title} />
              </div>
            ) : (
              <div className={`hidden h-36 w-36 items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br text-6xl shadow-lg shadow-slate-900/5 lg:flex ${post.gradient}`}>
                {post.emoji}
              </div>
            )}
          </div>

          <div className={`relative mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${
            coverImage ? 'min-h-52 sm:min-h-72' : `min-h-44 bg-gradient-to-br sm:min-h-52 ${post.gradient}`
          }`}>
            {coverImage ? (
              <>
                <BlogCover post={post} variant="hero-banner" title={post.title} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
                  BpxPro Insights
                </div>
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-0 bg-white/35" />
                <div className="relative flex min-h-44 flex-col items-center justify-center text-center sm:min-h-52">
                  <span className="text-7xl drop-shadow-sm sm:text-8xl">{post.emoji}</span>
                  <span className="mt-4 rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 backdrop-blur">
                    BpxPro Insights
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="blog-article" className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    In this article
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700 sm:text-base">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-7 sm:px-8 sm:py-9">
              <div id="article-content">
                <BlogContent content={post.content} />
              </div>

              <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
                <p className="text-base font-bold text-slate-900">Ready to get started?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Create your BpxPro account and get help from a personal WhatsApp agent.
                </p>
                <button
                  type="button"
                  onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  Register with Agent
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700">
                    {post.author?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Written by</p>
                    <p className="text-sm font-bold text-slate-900">{post.author}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {copied ? 'Link copied' : 'Share article'}
                  </button>
                  <SocialLinks
                    social={footer.social}
                    variant="light"
                    title="Follow us"
                    titleClassName="sr-only"
                  />
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Table of Contents
                </p>
              </div>

              {tocItems.length > 0 ? (
                <nav className="mt-4 max-h-[45vh] space-y-1.5 overflow-y-auto pr-1" aria-label="Table of contents">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block border-l-2 py-1.5 text-xs leading-relaxed transition-colors ${
                        item.level === 3 ? 'pl-5' : 'pl-3'
                      } ${
                        activeHeading === item.id
                          ? 'border-emerald-600 font-bold text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Read the complete guide below.
                </p>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'Link copied' : 'Share article'}
              </button>

              <SocialLinks
                social={footer.social}
                variant="light"
                className="mt-5 border-t border-slate-100 pt-5"
                title="Follow BpxPro"
                titleClassName="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-base font-extrabold text-emerald-700">
                  {post.author?.charAt(0)?.toUpperCase() || 'B'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500">BpxPro contributor</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Practical guides and expert insights to help BpxPro players make informed decisions.
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-600" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-600" />
                  {post.readTime}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
              <MessageCircle className="h-7 w-7 text-emerald-600" fill="currentColor" strokeWidth={0} />
              <p className="mt-3 text-sm font-bold text-slate-900">Need help?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Our WhatsApp agent can help with registration, deposits and withdrawals.
              </p>
              <button
                type="button"
                onClick={() => openModal('register', { registerPath: 'whatsapp' })}
                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Contact an Agent
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </aside>
        </div>
      </main>

      {relatedPosts.length > 0 && (
        <section className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Keep reading
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Related Articles</h2>
              </div>
              <Link
                to="/blog"
                className="hidden items-center gap-1 text-xs font-bold text-emerald-700 hover:underline sm:inline-flex"
              >
                View all articles
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {relatedPosts.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
