/** Convert stored content blocks to HTML for the rich editor */
export function contentToHtml(content) {
  if (!Array.isArray(content)) return ''

  const htmlBlock = content.find((b) => b.type === 'html' && b.html)
  if (htmlBlock) return htmlBlock.html

  return content
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `<h2>${escapeHtml(block.text || '')}</h2>`
        case 'p':
          return `<p>${escapeHtml(block.text || '')}</p>`
        case 'ul':
          return `<ul>${(block.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
        case 'ol':
          return `<ol>${(block.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`
        default:
          return ''
      }
    })
    .join('')
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Wrap editor HTML as a single content block for the API */
export function htmlToContentBlock(html) {
  const cleaned = String(html || '').trim()
  if (!cleaned || cleaned === '<p><br></p>') {
    return [{ type: 'html', html: '<p></p>' }]
  }
  return [{ type: 'html', html: cleaned }]
}
