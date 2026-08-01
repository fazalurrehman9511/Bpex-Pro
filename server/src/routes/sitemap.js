import { Readable } from 'stream'
import { Router } from 'express'
import { SitemapStream, streamToPromise } from 'sitemap'
import { db } from '../db.js'

const router = Router()
const SITE_URL = 'https://www.bpexpro.com'

const SITEMAP_STYLESHEET = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>XML Sitemap — BpxPro</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f7f8fa;
            color: #172033;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main { width: min(1100px, calc(100% - 32px)); margin: 42px auto; }
          h1 { margin: 0 0 8px; font-size: 32px; }
          .intro { margin: 0 0 28px; color: #64748b; }
          .card {
            overflow: hidden;
            border: 1px solid #dbe1ea;
            border-radius: 10px;
            background: white;
            box-shadow: 0 4px 18px rgba(15, 23, 42, .06);
          }
          .summary { padding: 14px 18px; border-bottom: 1px solid #dbe1ea; font-weight: 700; }
          .table-wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th {
            padding: 12px 16px;
            background: #0f172a;
            color: white;
            text-align: left;
            white-space: nowrap;
          }
          td { padding: 11px 16px; border-bottom: 1px solid #edf0f5; }
          tr:last-child td { border-bottom: 0; }
          tr:nth-child(even) { background: #f8fafc; }
          a { color: #087f5b; overflow-wrap: anywhere; }
          .muted { color: #64748b; white-space: nowrap; }
          @media (max-width: 640px) {
            main { margin: 24px auto; }
            h1 { font-size: 26px; }
            th, td { padding: 10px 12px; }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>XML Sitemap</h1>
          <p class="intro">BpxPro pages available for search engine indexing.</p>
          <div class="card">
            <div class="summary">
              URLs: <xsl:value-of select="count(sm:urlset/sm:url)"/>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Change Frequency</th>
                    <th>Priority</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sm:urlset/sm:url">
                    <tr>
                      <td>
                        <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                      </td>
                      <td class="muted"><xsl:value-of select="sm:changefreq"/></td>
                      <td class="muted"><xsl:value-of select="sm:priority"/></td>
                      <td class="muted">
                        <xsl:choose>
                          <xsl:when test="sm:lastmod"><xsl:value-of select="sm:lastmod"/></xsl:when>
                          <xsl:otherwise>—</xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`

function getPublishedPosts() {
  return db.prepare(`
    SELECT
      slug,
      featured,
      substr(COALESCE(updated_at, published_at), 1, 10) AS lastmod
    FROM blog_posts
    WHERE published = 1
    ORDER BY COALESCE(updated_at, published_at) DESC
  `).all()
}

export function buildSitemapLinks(posts = getPublishedPosts()) {
  const latestPostUpdate = posts[0]?.lastmod

  return [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/bpx', changefreq: 'weekly', priority: 0.9 },
    { url: '/privacy-policy', changefreq: 'monthly', priority: 0.5 },
    { url: '/terms-and-conditions', changefreq: 'monthly', priority: 0.5 },
    {
      url: '/blog',
      changefreq: 'weekly',
      priority: 0.8,
      ...(latestPostUpdate ? { lastmod: latestPostUpdate } : {}),
    },
    ...posts.map((post) => ({
      url: `/blog/${encodeURIComponent(post.slug)}`,
      changefreq: 'monthly',
      priority: post.featured ? 0.8 : 0.7,
      ...(post.lastmod ? { lastmod: post.lastmod } : {}),
    })),
  ]
}

export async function buildSitemapXml(posts = getPublishedPosts()) {
  const links = buildSitemapLinks(posts)
  const stream = new SitemapStream({
    hostname: SITE_URL,
    xmlns: {
      xhtml: false,
      image: false,
      video: false,
      news: false,
    },
  })

  const xmlBuffer = await streamToPromise(Readable.from(links).pipe(stream))
  const xml = xmlBuffer.toString()

  return xml.replace(
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl?v=1"?>',
  )
}

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await buildSitemapXml()
    res
      .set({
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/xml; charset=utf-8',
      })
      .send(xml)
  } catch (err) {
    console.error('Generate sitemap error:', err)
    res.status(500).type('text/plain').send('Failed to generate sitemap')
  }
})

router.get('/sitemap.xsl', (_req, res) => {
  res
    .set({
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/xsl; charset=utf-8',
    })
    .send(SITEMAP_STYLESHEET)
})

export default router
