import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
