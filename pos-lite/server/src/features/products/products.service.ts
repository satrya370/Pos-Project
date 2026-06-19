import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js'
import { CreateProductInput, UpdateProductInput, CreateSizeInput, UpdateSizeInput, RestockSizeInput } from './products.types.js'
import fs from 'fs/promises'
import path from 'path'
import { uploadConfig } from '../../config/upload.js'

export async function getProducts(ownerId: string) {
  return prisma.product.findMany({
    where: { ownerId },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      sizes: { orderBy: { name: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductById(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ownerId },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      sizes: { orderBy: { name: 'asc' } },
    },
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

  const { sizes, ...productData } = input

  const product = await prisma.product.create({
    data: {
      ...productData,
      ownerId,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      sizes: {
        create: sizes.map(size => ({
          name:        size.name,
          variantName: size.variantName ?? '',
          stock:       size.stock,
          sku:         size.sku,
        })),
      },
    },
    include: { sizes: true },
  })

  return product
}

export async function updateProduct(ownerId: string, productId: string, input: UpdateProductInput) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  if (input.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: input.categoryId, ownerId } })
    if (!category) throw new NotFoundError('Kategori tidak ditemukan')
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...input,
      expiryDate: input.expiryDate !== undefined
        ? (input.expiryDate ? new Date(input.expiryDate) : null)
        : undefined,
    },
    include: { sizes: true },
  })
}

export async function deleteProduct(ownerId: string, productId: string) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  const hasTransactions = await prisma.transactionItem.findFirst({ where: { productId } })
  if (hasTransactions) throw new BadRequestError('Produk tidak bisa dihapus karena sudah ada transaksi')

  // Delete image if exists
  if (existing.imageUrl) {
    const imagePath = path.join(uploadConfig.uploadDir, path.basename(existing.imageUrl))
    await fs.unlink(imagePath).catch(() => {})
  }

  return prisma.product.delete({ where: { id: productId } })
}

export async function uploadProductImage(ownerId: string, productId: string, file: Express.Multer.File) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  // Delete old image if exists
  if (existing.imageUrl) {
    const oldImagePath = path.join(uploadConfig.uploadDir, path.basename(existing.imageUrl))
    await fs.unlink(oldImagePath).catch(() => {})
  }

  const imageUrl = `/uploads/products/${file.filename}`

  return prisma.product.update({
    where: { id: productId },
    data: { imageUrl },
    include: { sizes: true },
  })
}

export async function deleteProductImage(ownerId: string, productId: string) {
  const existing = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!existing) throw new NotFoundError('Produk tidak ditemukan')

  if (existing.imageUrl) {
    const imagePath = path.join(uploadConfig.uploadDir, path.basename(existing.imageUrl))
    await fs.unlink(imagePath).catch(() => {})
  }

  return prisma.product.update({
    where: { id: productId },
    data: { imageUrl: null },
    include: { sizes: true },
  })
}

// Size CRUD
export async function getSizes(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  return prisma.productSize.findMany({
    where: { productId },
    orderBy: { name: 'asc' },
  })
}

export async function createSize(ownerId: string, productId: string, input: CreateSizeInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSize = await prisma.productSize.findFirst({
    where: { productId, name: input.name },
  })
  if (existingSize) throw new BadRequestError(`Ukuran ${input.name} sudah ada`)

  return prisma.productSize.create({
    data: {
      productId,
      name: input.name,
      stock: input.stock,
      sku: input.sku,
    },
  })
}

export async function updateSize(ownerId: string, productId: string, sizeId: string, input: UpdateSizeInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSize = await prisma.productSize.findFirst({
    where: { id: sizeId, productId },
  })
  if (!existingSize) throw new NotFoundError('Ukuran tidak ditemukan')

  if (input.name && input.name !== existingSize.name) {
    const duplicateSize = await prisma.productSize.findFirst({
      where: { productId, name: input.name, id: { not: sizeId } },
    })
    if (duplicateSize) throw new BadRequestError(`Ukuran ${input.name} sudah ada`)
  }

  return prisma.productSize.update({
    where: { id: sizeId },
    data: input,
  })
}

export async function deleteSize(ownerId: string, productId: string, sizeId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSize = await prisma.productSize.findFirst({
    where: { id: sizeId, productId },
  })
  if (!existingSize) throw new NotFoundError('Ukuran tidak ditemukan')

  const hasTransactions = await prisma.transactionItem.findFirst({ where: { productSizeId: sizeId } })
  if (hasTransactions) throw new BadRequestError('Ukuran tidak bisa dihapus karena sudah ada transaksi')

  return prisma.productSize.delete({ where: { id: sizeId } })
}

export async function restockSize(ownerId: string, productId: string, sizeId: string, input: RestockSizeInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSize = await prisma.productSize.findFirst({
    where: { id: sizeId, productId },
  })
  if (!existingSize) throw new NotFoundError('Ukuran tidak ditemukan')

  const updated = await prisma.productSize.update({
    where: { id: sizeId },
    data: { stock: { increment: input.quantity } },
  })

  await prisma.stockMovement.create({
    data: {
      productId,
      type: 'IN',
      quantity: input.quantity,
      notes: input.notes || `Restock ${existingSize.name} ${input.quantity} unit`,
      purchasePrice: input.purchasePrice ?? null,
      invoiceNumber: input.invoiceNumber ?? null,
      supplierId:    input.supplierId ?? null,
    },
  })

  return updated
}

export async function getRestockHistory(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')
  return prisma.stockMovement.findMany({
    where: { productId, type: 'IN' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLowStockProducts(ownerId: string) {
  const products = await prisma.product.findMany({
    where: { ownerId },
    include: {
      sizes: { select: { id: true, name: true, stock: true } },
    },
  })

  return products.filter(p => {
    if (p.sizes.length === 0) return false
    return p.sizes.some(s => s.stock < p.minStockThreshold)
  })
}

export async function addVariant(ownerId: string, productId: string, variantName: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSizes = await prisma.productSize.findMany({ where: { productId } })

  const uniqueSizeNames = [...new Set(existingSizes.map(s => s.name))]

  if (uniqueSizeNames.length === 0) {
    return prisma.productSize.createMany({
      data: [{ productId, name: 'Default', variantName, stock: 0 }],
    })
  }

  const alreadyExists = existingSizes.some(s => s.variantName === variantName)
  if (alreadyExists) throw new BadRequestError(`Varian "${variantName}" sudah ada`)

  return prisma.productSize.createMany({
    data: uniqueSizeNames.map(sizeName => ({ productId, name: sizeName, variantName, stock: 0 })),
  })
}

export async function addSizeName(ownerId: string, productId: string, sizeName: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const existingSizes = await prisma.productSize.findMany({ where: { productId } })

  const uniqueVariantNames = [...new Set(existingSizes.map(s => s.variantName))]

  if (uniqueVariantNames.length === 0) {
    return prisma.productSize.createMany({
      data: [{ productId, name: sizeName, variantName: '', stock: 0 }],
    })
  }

  const alreadyExists = existingSizes.some(s => s.name === sizeName)
  if (alreadyExists) throw new BadRequestError(`Ukuran "${sizeName}" sudah ada`)

  return prisma.productSize.createMany({
    data: uniqueVariantNames.map(vn => ({ productId, name: sizeName, variantName: vn, stock: 0 })),
  })
}

export async function deleteVariant(ownerId: string, productId: string, variantName: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const sizesToDelete = await prisma.productSize.findMany({ where: { productId, variantName } })
  if (sizesToDelete.length === 0) throw new NotFoundError(`Varian "${variantName}" tidak ditemukan`)

  const sizeIds = sizesToDelete.map(s => s.id)
  const txCount = await prisma.transactionItem.count({ where: { productSizeId: { in: sizeIds } } })
  if (txCount > 0) throw new ConflictError(`Tidak bisa hapus — ada ${txCount} transaksi terkait varian ini`)

  const result = await prisma.productSize.deleteMany({ where: { productId, variantName } })
  return result
}

export async function deleteSizeName(ownerId: string, productId: string, sizeName: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')

  const sizesToDelete = await prisma.productSize.findMany({ where: { productId, name: sizeName } })
  if (sizesToDelete.length === 0) throw new NotFoundError(`Ukuran "${sizeName}" tidak ditemukan`)

  const sizeIds = sizesToDelete.map(s => s.id)
  const txCount = await prisma.transactionItem.count({ where: { productSizeId: { in: sizeIds } } })
  if (txCount > 0) throw new ConflictError(`Tidak bisa hapus — ada ${txCount} transaksi terkait ukuran ini`)

  const result = await prisma.productSize.deleteMany({ where: { productId, name: sizeName } })
  return result
}

export async function getExpiringProducts(ownerId: string, withinDays = 30) {
  const now = new Date()
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)

  return prisma.product.findMany({
    where: {
      ownerId,
      expiryDate: { not: null, lte: threshold },
    },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      sizes: { orderBy: { name: 'asc' } },
    },
    orderBy: { expiryDate: 'asc' },
  })
}

export async function getStockSummary(ownerId: string) {
  const products = await prisma.product.findMany({
    where: { ownerId },
    include: { sizes: { select: { id: true, name: true, stock: true } } },
  })

  let totalStockValue = 0
  let outOfStockCount = 0
  let lowStockCount = 0

  for (const p of products) {
    for (const s of p.sizes) {
      totalStockValue += s.stock * p.purchasePrice
      if (s.stock === 0) outOfStockCount++
      else if (s.stock < p.minStockThreshold) lowStockCount++
    }
  }

  // Dead stock: products with stock > 0 but no sales in last 30 days
  const thirtyDaysAgo = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate() - 30
  ))

  const soldProductIds = await prisma.transactionItem.findMany({
    where: {
      transaction: { ownerId, createdAt: { gte: thirtyDaysAgo }, status: 'completed' },
      productId: { not: null },
    },
    select: { productId: true },
    distinct: ['productId'],
  })
  const soldIds = new Set(soldProductIds.map(i => i.productId!))

  const deadStockProducts = products
    .filter(p => p.sizes.some(s => s.stock > 0) && !soldIds.has(p.id))
    .map(p => ({ id: p.id, name: p.name, sizes: p.sizes }))

  return { totalStockValue, outOfStockCount, lowStockCount, deadStockProducts }
}
