import { prisma } from '../../lib/prisma.js'
import { UnauthorizedError, NotFoundError } from '../../lib/errors.js'
import { signToken } from '../../lib/jwt.js'
import bcrypt from 'bcryptjs'
import { LoginInput, AuthResponse } from './auth.types.js'

async function findOwnerByEmail(email: string) {
  const owner = await prisma.owner.findUnique({ where: { email } })
  if (!owner) throw new UnauthorizedError('Email atau password salah')
  return owner
}

async function verifyPassword(password: string, passwordHash: string) {
  const valid = await bcrypt.compare(password, passwordHash)
  if (!valid) throw new UnauthorizedError('Email atau password salah')
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const owner = await findOwnerByEmail(data.email)
  await verifyPassword(data.password, owner.passwordHash)

  return {
    token: signToken(owner.id),
    owner: { id: owner.id, name: owner.name, email: owner.email },
  }
}

export async function getMe(ownerId: string) {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    select: { id: true, name: true, email: true, phone: true, waNumber: true, telegramChatId: true, dailyTarget: true },
  })

  if (!owner) throw new NotFoundError('Owner tidak ditemukan')
  return owner
}

export async function getDailyTarget(ownerId: string) {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    select: { dailyTarget: true },
  })
  if (!owner) throw new NotFoundError('Owner tidak ditemukan')
  return { dailyTarget: owner.dailyTarget ?? 0 }
}

export async function updateDailyTarget(ownerId: string, dailyTarget: number) {
  const owner = await prisma.owner.update({
    where: { id: ownerId },
    data: { dailyTarget },
    select: { dailyTarget: true },
  })
  return { dailyTarget: owner.dailyTarget ?? 0 }
}
