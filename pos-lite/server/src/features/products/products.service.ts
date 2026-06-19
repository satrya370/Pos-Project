import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError } from '../../lib/errors.js'
import { CreateProductInput, UpdateProductInput, RestockInput } from './products.types.js'

export async function getProducts(ownerId: string) {
  return prisma.product.findMany({
    where: { ownerId },
    include: { category: { select: { id: true, name: true, icon: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductById(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ownerId },
    include: { category: { select: { id: true, name: true, icon: true } } },
  })

  if (!product) throw new NotFoundError('Produk tidak ditemukan')
  return product
}

export async function createProduct(ownerId: string, input: CreateProductInput) {
  if (input.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: input.categoryId, ownerId } })
    if (!category) throw new NotFoundError('Kategori tidak ditemukan')
  }

  if (input.supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, ownerId } })
    if (!supplier) throw new NotFoundError('Supplier tidak ditemukan')
  }

  return prisma.product.create({ data: { ...input, ownerId } })
}

export async function updateProduct(ownerId: string, productId: string, input: UpdateProductInput) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  if (input.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: input.categoryId, ownerId } })
    if (!category) throw new NotFoundError('Kategori tidak ditemukan')
  }

  return prisma.product.update({ where: { id: productId }, data: input })
}

export async function deleteProduct(ownerId: string, productId: string) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  const hasTransactions = await prisma.transactionItem.findFirst({ where: { productId } })
  if (hasTransactions) throw new BadRequestError('Produk tidak bisa dihapus karena sudah ada transaksi')

  return prisma.product.delete({ where: { id: productId } })
}

export async function restock(ownerId: string, productId: string, input: RestockInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: input.quantity } },
  })

  await prisma.stockMovement.create({
    data: {
      productId,
      type: 'IN',
      quantity: input.quantity,
      notes: input.notes || `Restock ${input.quantity} unit`,
    },
  })

  return updated
}

export async function getLowStockProducts(ownerId: string) {
  const products = await prisma.product.findMany({
    where: { ownerId },
    select: { id: true, name: true, stock: true, minStockThreshold: true },
  })

  return products.filter(p => p.stock < p.minStockThreshold)
}
