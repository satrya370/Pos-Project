import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js'
import { CreateCustomerInput, UpdateCustomerInput } from './customers.types.js'

export async function getCustomers(ownerId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      ownerId,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: 'asc' },
  })
}

export async function getCustomerById(ownerId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, ownerId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, invoiceNumber: true, totalAmount: true,
          paymentStatus: true, status: true, createdAt: true, itemsCount: true,
        },
      },
    },
  })
  if (!customer) throw new NotFoundError('Customer tidak ditemukan')
  return customer
}

export async function createCustomer(ownerId: string, input: CreateCustomerInput) {
  try {
    return await prisma.customer.create({ data: { ownerId, ...input } })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') throw new ConflictError('Nomor telepon sudah terdaftar')
    throw err
  }
}

export async function updateCustomer(ownerId: string, id: string, input: UpdateCustomerInput) {
  const existing = await prisma.customer.findFirst({ where: { id, ownerId } })
  if (!existing) throw new NotFoundError('Customer tidak ditemukan')
  try {
    return await prisma.customer.update({ where: { id }, data: input })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') throw new ConflictError('Nomor telepon sudah terdaftar')
    throw err
  }
}

export async function deleteCustomer(ownerId: string, id: string) {
  const existing = await prisma.customer.findFirst({ where: { id, ownerId } })
  if (!existing) throw new NotFoundError('Customer tidak ditemukan')
  const hasDebt = await prisma.transaction.findFirst({
    where: { customerId: id, paymentStatus: 'credit' },
  })
  if (hasDebt) throw new BadRequestError('Customer memiliki hutang yang belum lunas')
  await prisma.customer.delete({ where: { id } })
}
