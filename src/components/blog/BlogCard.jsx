import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, User } from 'lucide-react'
import { formatDate } from '../../data/blogPosts'

export default function BlogCard({ post, featured = false }) {
  if (featured) {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group grid overflow-hidden rounded-2xl border border-border bg-navy-light shadow-lg shadow-black/20 transition-all hover:border-accent/50 hover:shadow-accent/5 md:grid-cols-[minmax(220px,32%)_1fr]"
      >
        <div
          className={`relative flex min-h-[200px] items-center justify-center bg-gradient-to-br ${post.gradient} p-8 md:min-h-[260px]`}
        >
          <span className="text-5xl sm:text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
            {post.emoji}
          </span>
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-dark">
            Featured
          </span>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <span className="w-fit rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {post.categoryLabel}
          </span>
          <h2 className="mt-3 text-xl font-extrabold leading-snug text-text transition-colors group-hover:text-accent sm:text-2xl">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3 sm:text-base">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-accent/70" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent/70" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent/70" />
                {post.readTime}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent transition-all group-hover:gap-2.5">
              Read article
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-navy-light transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-black/15"
    >
      <div
        className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${post.gradient} sm:h-32`}
      >
        <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
          {post.emoji}
        </span>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.25),transparent)]" />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {post.categoryLabel}
          </span>
          <span className="text-[10px] text-muted">{formatDate(post.date)}</span>
        </div>

        <h3 className="mt-2.5 text-sm font-bold leading-snug text-text line-clamp-2 transition-colors group-hover:text-accent sm:text-base">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted line-clamp-3 sm:text-sm">
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <User className="h-3 w-3 shrink-0" />
            {post.author}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  )
}
