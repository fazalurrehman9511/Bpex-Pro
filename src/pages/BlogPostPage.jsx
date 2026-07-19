import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { Calendar, Clock, User, ArrowLeft, Share2, MessageCircle } from 'lucide-react'
import { blogPosts as staticPosts, formatDate } from '../data/blogPosts'
import { fetchBlogPost, fetchBlogPosts } from '../utils/api'
import { useModal } from '../context/ModalContext'
import BlogContent from '../components/blog/BlogContent'
import BlogCard from '../components/blog/BlogCard'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { openModal } = useModal()
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

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

  if (notFound) return <Navigate to="/blog" replace />

  if (loading || !post) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Loading article…
      </div>
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: post.title, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="min-h-screen">
      <div className={`bg-gradient-to-br ${post.gradient} px-4 py-12 sm:px-6 sm:py-16`}>
        <div className="mx-auto max-w-5xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text/80 hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>
          <span className="text-5xl sm:text-6xl block mb-4">{post.emoji}</span>
          <span className="rounded bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase">
            {post.categoryLabel}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-text leading-tight sm:text-3xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          </div>
        </div>
      </div>

      <article className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-base font-medium text-text/90 leading-relaxed border-l-4 border-accent pl-4">
            {post.excerpt}
          </p>

          <BlogContent content={post.content} />

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text hover:border-accent/40 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share Article
            </button>
            <button
              onClick={() => openModal('register')}
              className="inline-flex items-center justify-center gap-2 rounded bg-accent px-6 py-2.5 text-xs font-bold text-navy-dark hover:bg-accent-hover transition-colors"
            >
              <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              Register &amp; Start Betting
            </button>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-navy-dark px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-5 text-base font-bold text-text">Related Articles</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
