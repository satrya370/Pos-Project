import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signToken, verifyToken } from '../../lib/jwt.js'
import { login, getMe } from './auth.service.js'

const prisma = new PrismaClient()

const TEST_OWNER = {
  name: 'Test Owner',
  email: 'test@test.com',
  password: 'test123',
}

let ownerId: string

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(TEST_OWNER.password, 10)
  const owner = await prisma.owner.create({
    data: { name: TEST_OWNER.name, email: TEST_OWNER.email, passwordHash },
  })
  ownerId = owner.id
})

afterAll(async () => {
  await prisma.owner.deleteMany({ where: { email: TEST_OWNER.email } })
  await prisma.$disconnect()
})

describe('Auth Service', () => {
  describe('login', () => {
    it('should return token and owner data with valid credentials', async () => {
      const result = await login({ email: TEST_OWNER.email, password: TEST_OWNER.password })

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('owner')
      expect(result.owner.email).toBe(TEST_OWNER.email)
      expect(result.owner.name).toBe(TEST_OWNER.name)
      expect(result.owner).not.toHaveProperty('passwordHash')
    })

    it('should throw UnauthorizedError with wrong password', async () => {
      await expect(login({ email: TEST_OWNER.email, password: 'wrong' }))
        .rejects.toThrow('Email atau password salah')
    })

    it('should throw UnauthorizedError with non-existent email', async () => {
      await expect(login({ email: 'notexist@test.com', password: 'any' }))
        .rejects.toThrow('Email atau password salah')
    })
  })

  describe('getMe', () => {
    it('should return owner data with valid ownerId', async () => {
      const result = await getMe(ownerId)

      expect(result.email).toBe(TEST_OWNER.email)
      expect(result.name).toBe(TEST_OWNER.name)
      expect(result).not.toHaveProperty('passwordHash')
    })

    it('should throw NotFoundError with invalid ownerId', async () => {
      await expect(getMe('nonexistent-id')).rejects.toThrow('Owner tidak ditemukan')
    })
  })

  describe('JWT', () => {
    it('should sign and verify token correctly', () => {
      const token = signToken(ownerId)
      const payload = verifyToken(token)
      expect(payload.ownerId).toBe(ownerId)
    })

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow()
    })
  })
})
