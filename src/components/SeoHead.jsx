import { useEffect } from 'react'
import { SITE_URL } from '../config/brand'

const ROUTE_JSON_LD_ID = 'route-seo-jsonld'

function upsertMeta(selector, attrName, attrValue, content) {
  let el = document.querySelector(selector)
  const existed = Boolean(el)

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }

  const previousContent = el.getAttribute('content')
  el.setAttribute('content', content)

  return { el, existed, previousContent }
}

function upsertLink(selector, rel, href) {
  let el = document.querySelector(selector)
  const existed = Boolean(el)

  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }

  const previousHref = el.getAttribute('href')
  el.setAttribute('href', href)

  return { el, existed, previousHref }
}

export default function SeoHead({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  ogType = 'website',
  ogImage,
  jsonLd = null,
}) {
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString()
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''
  const ogImageUrl = ogImage
    ? (ogImage.startsWith('http') ? ogImage : new URL(ogImage, SITE_URL).toString())
    : ''

  useEffect(() => {
    const previousTitle = document.title

    const metaUpdates = [
      upsertMeta('meta[name="description"]', 'name', 'description', description),
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', ogTitle || title),
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', ogDescription || description),
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl),
      upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType),
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', twitterTitle || ogTitle || title),
      upsertMeta(
        'meta[name="twitter:description"]',
        'name',
        'twitter:description',
        twitterDescription || ogDescription || description,
      ),
    ]

    if (keywords) {
      metaUpdates.push(upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords))
    }

    if (ogImageUrl) {
      metaUpdates.push(upsertMeta('meta[property="og:image"]', 'property', 'og:image', ogImageUrl))
      metaUpdates.push(upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImageUrl))
      metaUpdates.push(upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image'))
    }

    const canonicalUpdate = upsertLink('link[rel="canonical"]', 'canonical', canonicalUrl)

    document.title = title

    let jsonLdScript = document.getElementById(ROUTE_JSON_LD_ID)
    if (jsonLdString) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script')
        jsonLdScript.type = 'application/ld+json'
        jsonLdScript.id = ROUTE_JSON_LD_ID
        document.head.appendChild(jsonLdScript)
      }
      jsonLdScript.textContent = jsonLdString
    } else if (jsonLdScript) {
      jsonLdScript.remove()
    }

    return () => {
      document.title = previousTitle

      metaUpdates.forEach(({ el, existed, previousContent }) => {
        if (!existed) {
          el.remove()
          return
        }
        if (previousContent == null) {
          el.removeAttribute('content')
        } else {
          el.setAttribute('content', previousContent)
        }
      })

      if (!canonicalUpdate.existed) {
        canonicalUpdate.el.remove()
      } else if (canonicalUpdate.previousHref == null) {
        canonicalUpdate.el.removeAttribute('href')
      } else {
        canonicalUpdate.el.setAttribute('href', canonicalUpdate.previousHref)
      }

      document.getElementById(ROUTE_JSON_LD_ID)?.remove()
    }
  }, [
    canonicalUrl,
    description,
    jsonLdString,
    keywords,
    ogDescription,
    ogTitle,
    ogType,
    ogImageUrl,
    title,
    twitterDescription,
    twitterTitle,
  ])

  return null
}
