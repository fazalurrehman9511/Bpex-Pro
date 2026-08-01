import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, User } from 'lucide-react'
import { formatDate } from '../../data/blogPosts'
import BlogCover, { getBlogCoverImage } from './BlogCover'

export default function BlogCard({ post, featured = false }) {
  const hasCover = Boolean(getBlogCoverImage(post))

  if (featured) {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 md:grid-cols-[minmax(240px,36%)_1fr]"
      >
        <div
          className={`relative flex min-h-[210px] items-center justify-center overflow-hidden md:min-h-[300px] ${
            hasCover ? 'bg-slate-100' : `bg-gradient-to-br ${post.gradient} p-8`
          }`}
        >
          {!hasCover && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-white/35" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.7),transparent_55%)]" />
            </>
          )}
          <BlogCover post={post} variant="featured-card" />
          <span className="absolute left-4 top-4 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm backdrop-blur">
            Featured
          </span>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-9">
          <span className="w-fit text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            {post.categoryLabel}
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 sm:text-base">
            {post.excerpt}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {post.readTime}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition-all group-hover:gap-2.5">
              Read article
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <div
        className={`relative flex h-36 items-center justify-center overflow-hidden sm:h-40 ${
          hasCover ? 'bg-slate-100' : `bg-gradient-to-br ${post.gradient}`
        }`}
      >
        {!hasCover && <div className="pointer-events-none absolute inset-0 bg-white/40" />}
        <BlogCover post={post} variant="card" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            {post.categoryLabel}
          </span>
          <span className="text-[10px] text-slate-400">{formatDate(post.date)}</span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
          {post.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <User className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            {post.author}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  )
}
