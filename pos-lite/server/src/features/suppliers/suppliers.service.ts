import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js'
import { CreateSupplierInput, UpdateSupplierInput } from './suppliers.types.js'

export async function getSuppliers(ownerId: string) {
  return prisma.supplier.findMany({
    where: { ownerId },
    orderBy: { name: 'asc' },
  })
}

export async function getSupplierById(ownerId: string, id: string) {
  const supplier = await prisma.supplier.findFirst({ where: { id, ownerId } })
  if (!supplier) throw new NotFoundError('Supplier tidak ditemukan')
  return supplier
}

export async function createSupplier(ownerId: string, input: CreateSupplierInput) {
  try {
    return await prisma.supplier.create({
      data: { ownerId, ...input },
    })
  } catch (err: any) {
    if (err?.code === 'P2002') throw new ConflictError('Nama supplier sudah digunakan')
    throw err
  }
}

export async function updateSupplier(ownerId: string, id: string, input: UpdateSupplierInput) {
  await getSupplierById(ownerId, id)
  return prisma.supplier.update({
    where: { id },
    data: input,
  })
}

export async function deleteSupplier(ownerId: string, id: string) {
  await getSupplierById(ownerId, id)
  const related = await prisma.product.findFirst({ where: { supplierId: id } })
  if (related) throw new BadRequestError('Supplier memiliki produk terkait, tidak bisa dihapus')
  return prisma.supplier.delete({ where: { id } })
}
