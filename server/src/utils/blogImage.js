import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

export function saveBlogImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null

  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg'
  const filename = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filepath = path.join(config.uploadsDir, filename)

  fs.writeFileSync(filepath, Buffer.from(match[2], 'base64'))
  return filename
}
