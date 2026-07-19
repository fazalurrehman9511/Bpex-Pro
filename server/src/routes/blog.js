import { Router } from 'express'
import { db, rowToBlogPost, seedBlogPostsIfEmpty } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { saveBlogImage } from '../utils/blogImage.js'

const router = Router()

const CATEGORY_LABELS = {
  cricket: 'Cricket',
  guides: 'Guides',
  payments: 'Payments',
  tips: 'Tips',
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ')
}

function estimateReadTime(content) {
  const blocks = typeof content === 'string' ? JSON.parse(content || '[]') : content
  const text = (Array.isArray(blocks) ? blocks : [])
    .map((block) => {
      if (block.type === 'html') return stripHtml(block.html)
      if (block.text) return block.text
      if (block.items) return block.items.join(' ')
      return ''
    })
    .join(' ')
  const words = text.split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

function paragraphsToContent(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'p', text: p }))
}

function normalizeContent(content, bodyText, htmlContent) {
  const html = String(htmlContent || '').trim()
  if (html && html !== '<p><br></p>') {
    return [{ type: 'html', html }]
  }
  if (Array.isArray(content) && content.length) return content
  if (typeof content === 'string' && content.trim()) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) return parsed
    } catch {
      if (content.includes('<')) {
        return [{ type: 'html', html: content.trim() }]
      }
      return paragraphsToContent(content)
    }
  }
  if (bodyText) return paragraphsToContent(bodyText)
  return [{ type: 'html', html: '<p></p>' }]
}

function uniqueSlug(base, excludeId = null) {
  let slug = slugify(base) || `post-${Date.now()}`
  let candidate = slug
  let n = 2
  while (true) {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(candidate)
    if (!existing || (excludeId && existing.id === excludeId)) return candidate
    candidate = `${slug}-${n++}`
  }
}

function buildPostPayload(body, existing = null) {
  const title = String(body.title || existing?.title || '').trim()
  if (!title) return { error: 'Title is required' }

  const category = String(body.category || existing?.category || 'guides').trim()
  const categoryLabel = CATEGORY_LABELS[category] || String(body.categoryLabel || body.category_label || category)
  const content = normalizeContent(
    body.content,
    body.bodyText || body.body_text,
    body.htmlContent || body.html_content
  )
  const now = new Date().toISOString()
  const publishedAt = body.date || body.publishedAt || body.published_at || existing?.published_at || now.slice(0, 10)

  return {
    slug: body.slug?.trim() ? uniqueSlug(body.slug.trim(), existing?.id) : uniqueSlug(title, existing?.id),
    title,
    excerpt: String(body.excerpt || existing?.excerpt || '').trim(),
    category,
    category_label: categoryLabel,
    author: String(body.author || existing?.author || 'FlowExch Team').trim(),
    published_at: publishedAt,
    read_time: body.readTime || body.read_time || estimateReadTime(content),
    featured: body.featured !== undefined ? (body.featured ? 1 : 0) : (existing?.featured ? 1 : 0),
    gradient: String(body.gradient || existing?.gradient || 'from-green-600/40 to-navy-light').trim(),
    emoji: String(body.emoji || existing?.emoji || '📝').trim(),
    content: JSON.stringify(content),
    published: body.published !== undefined ? (body.published ? 1 : 0) : (existing?.published !== 0 ? 1 : 0),
    updated_at: now,
    created_at: existing?.created_at || now,
  }
}

seedBlogPostsIfEmpty()

router.get('/posts', (_req, res) => {
  try {
    const { category } = _req.query
    let sql = 'SELECT * FROM blog_posts WHERE published = 1'
    const params = []
    if (category && category !== 'all') {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY published_at DESC, created_at DESC'
    const rows = db.prepare(sql).all(...params)
    res.json(rows.map(rowToBlogPost))
  } catch (err) {
    console.error('List blog posts error:', err)
    res.status(500).json({ error: 'Failed to fetch blog posts' })
  }
})

router.get('/posts/:slug', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug)
    if (!row) return res.status(404).json({ error: 'Post not found' })
    res.json(rowToBlogPost(row))
  } catch (err) {
    console.error('Get blog post error:', err)
    res.status(500).json({ error: 'Failed to fetch blog post' })
  }
})

router.get('/admin/posts', requireAdmin, (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM blog_posts ORDER BY published_at DESC, created_at DESC').all()
    res.json(rows.map(rowToBlogPost))
  } catch (err) {
    console.error('Admin list blog posts error:', err)
    res.status(500).json({ error: 'Failed to fetch blog posts' })
  }
})

router.post('/admin/posts', requireAdmin, (req, res) => {
  try {
    const payload = buildPostPayload(req.body)
    if (payload.error) return res.status(400).json({ error: payload.error })

    if (payload.featured) {
      db.prepare('UPDATE blog_posts SET featured = 0').run()
    }

    const result = db.prepare(`
      INSERT INTO blog_posts (
        slug, title, excerpt, category, category_label, author,
        published_at, read_time, featured, gradient, emoji,
        content, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.slug,
      payload.title,
      payload.excerpt,
      payload.category,
      payload.category_label,
      payload.author,
      payload.published_at,
      payload.read_time,
      payload.featured,
      payload.gradient,
      payload.emoji,
      payload.content,
      payload.published,
      payload.created_at,
      payload.updated_at
    )

    const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(rowToBlogPost(row))
  } catch (err) {
    console.error('Create blog post error:', err)
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

router.patch('/admin/posts/:id', requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Post not found' })

    const payload = buildPostPayload(req.body, existing)
    if (payload.error) return res.status(400).json({ error: payload.error })

    if (payload.featured) {
      db.prepare('UPDATE blog_posts SET featured = 0 WHERE id != ?').run(existing.id)
    }

    db.prepare(`
      UPDATE blog_posts SET
        slug = ?, title = ?, excerpt = ?, category = ?, category_label = ?,
        author = ?, published_at = ?, read_time = ?, featured = ?,
        gradient = ?, emoji = ?, content = ?, published = ?, updated_at = ?
      WHERE id = ?
    `).run(
      payload.slug,
      payload.title,
      payload.excerpt,
      payload.category,
      payload.category_label,
      payload.author,
      payload.published_at,
      payload.read_time,
      payload.featured,
      payload.gradient,
      payload.emoji,
      payload.content,
      payload.published,
      payload.updated_at,
      existing.id
    )

    const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(existing.id)
    res.json(rowToBlogPost(row))
  } catch (err) {
    console.error('Update blog post error:', err)
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

router.post('/admin/upload-image', requireAdmin, (req, res) => {
  try {
    const filename = saveBlogImage(req.body?.image)
    if (!filename) return res.status(400).json({ error: 'Invalid image data' })
    res.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('Blog image upload error:', err)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

router.delete('/admin/posts/:id', requireAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id)
    if (!result.changes) return res.status(404).json({ error: 'Post not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete blog post error:', err)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

export default router
