export function getBlogCoverImage(post) {
  return post?.coverImage || post?.cover_image || ''
}

export default function BlogCover({
  post,
  variant = 'card',
  className = '',
  title,
}) {
  const cover = getBlogCoverImage(post)
  const alt = title || post?.title || 'Blog cover'

  if (cover) {
    if (variant === 'hero-thumb') {
      return (
        <img
          src={cover}
          alt={alt}
          className={`h-full w-full rounded-3xl object-cover ${className}`}
          loading="eager"
          decoding="async"
        />
      )
    }

    if (variant === 'hero-banner') {
      return (
        <img
          src={cover}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          loading="eager"
          decoding="async"
        />
      )
    }

    return (
      <img
        src={cover}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    )
  }

  const emojiClass =
    variant === 'hero-thumb'
      ? 'text-6xl'
      : variant === 'hero-banner'
        ? 'text-7xl drop-shadow-sm sm:text-8xl'
        : variant === 'featured-card'
          ? 'text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105 sm:text-7xl'
          : 'text-5xl transition-transform duration-300 group-hover:scale-105'

  return <span className={`relative ${emojiClass} ${className}`}>{post?.emoji}</span>
}
