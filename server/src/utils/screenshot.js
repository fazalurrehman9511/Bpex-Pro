import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

export function saveScreenshot(dataUrl, transactionId) {
  if (!dataUrl || typeof dataUrl !== 'string') return null

  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const filename = `${transactionId}.${ext}`
  const filepath = path.join(config.uploadsDir, filename)

  fs.writeFileSync(filepath, Buffer.from(match[2], 'base64'))
  return filename
}
