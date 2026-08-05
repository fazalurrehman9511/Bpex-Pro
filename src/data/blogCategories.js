import { blogCategories as staticBlogCategories } from './blogPosts'

const CACHE_KEY = 'bpex-blog-categories-v1'

export const DEFAULT_BLOG_CATEGORIES = staticBlogCategories.filter((c) => c.id !== 'all')

let memoryCache = null

export function getBlogCategoriesCache() {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        memoryCache = parsed
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BLOG_CATEGORIES
}

export function setBlogCategoriesCache(categories) {
  memoryCache = categories
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(categories))
  } catch {
    /* ignore */
  }
}

export function blogCategoriesWithAll(categories = getBlogCategoriesCache()) {
  return [{ id: 'all', label: 'All Posts' }, ...categories]
}

export function slugifyCategoryId(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
