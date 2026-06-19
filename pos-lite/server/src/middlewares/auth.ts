import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { UnauthorizedError } from '../lib/errors.js'

export interface AuthRequest extends Request {
  ownerId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token tidak ditemukan'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)
    req.ownerId = payload.ownerId
    next()
  } catch {
    next(new UnauthorizedError('Token tidak valid'))
  }
}
