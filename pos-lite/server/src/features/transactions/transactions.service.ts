import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError } from '../../lib/errors.js'
import { generateInvoiceNumber } from '../../utils/invoice.js'
import { CreateTransactionInput } from './transactions.types.js'

export async function getTransactions(ownerId: string, startDate?: string, endDate?: string) {
  const where: Record<string, unknown> = { ownerId }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
  }

  return prisma.transaction.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTransactionById(ownerId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, ownerId },
    include: { items: true },
  })

  if (!transaction) throw new NotFoundError('Transaksi tidak ditemukan')
  return transaction
}

async function validateProducts(ownerId: string, productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, ownerId },
  })
  if (products.length !== productIds.length) {
    throw new NotFoundError('Salah satu produk tidak ditemukan')
  }
  return new Map(products.map(p => [p.id, p]))
}

function checkStock(productMap: Map<string, { name: string; stock: number }>, items: { productId: string; quantity: number }[]) {
  for (const item of items) {
    const product = productMap.get(item.productId)!
    if (product.stock < item.quantity) {
      throw new BadRequestError(`Stok ${product.name} tidak cukup (tersisa ${product.stock})`)
    }
  }
}

function buildTransactionItems(productMap: Map<string, { sellingPrice: number; purchasePrice: number; name: string }>, items: CreateTransactionInput['items']) {
  let totalAmount = 0
  let totalCost = 0
  const transactionItems = items.map(item => {
    const product = productMap.get(item.productId)!
    const subtotal = product.sellingPrice * item.quantity
    totalAmount += subtotal
    totalCost += product.purchasePrice * item.quantity
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      costAtPurchase: product.purchasePrice,
      subtotal,
    }
  })
  return { transactionItems, totalAmount, totalCost }
}

async function updateStockAndMovements(items: CreateTransactionInput['items'], transactionId: string, invoiceNumber: string) {
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        referenceId: transactionId,
        notes: `Transaksi ${invoiceNumber}`,
      },
    })
  }
}

export async function createTransaction(ownerId: string, input: CreateTransactionInput) {
  const productIds = input.items.map(item => item.productId)
  const productMap = await validateProducts(ownerId, productIds)
  checkStock(productMap, input.items)

  const { transactionItems, totalAmount, totalCost } = buildTransactionItems(productMap, input.items)
  const invoiceNumber = await generateInvoiceNumber()
  const itemsCount = input.items.reduce((sum, item) => sum + item.quantity, 0)

  const transaction = await prisma.transaction.create({
    data: {
      ownerId,
      invoiceNumber,
      totalAmount,
      totalCost,
      profit: totalAmount - totalCost,
      itemsCount,
      notes: input.notes,
      items: { create: transactionItems },
    },
    include: { items: true },
  })

  await updateStockAndMovements(input.items, transaction.id, invoiceNumber)
  return transaction
}

async function restoreStock(items: { productId: string | null; quantity: number }[], transactionId: string, invoiceNumber: string) {
  for (const item of items) {
    if (!item.productId) continue
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    })
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        referenceId: transactionId,
        notes: `Void transaksi ${invoiceNumber}`,
      },
    })
  }
}

export async function voidTransaction(ownerId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, ownerId },
    include: { items: true },
  })

  if (!transaction) throw new NotFoundError('Transaksi tidak ditemukan')
  if (transaction.status === 'voided') throw new BadRequestError('Transaksi sudah di-void')

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'voided' },
  })

  await restoreStock(transaction.items, transactionId, transaction.invoiceNumber)

  return prisma.transaction.findFirst({
    where: { id: transactionId },
    include: { items: true },
  })
}
