import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'poslite-dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

interface TokenPayload {
  ownerId: string
}

export function signToken(ownerId: string): string {
  return jwt.sign({ ownerId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as unknown as number })
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
  return { ownerId: payload.ownerId }
}
