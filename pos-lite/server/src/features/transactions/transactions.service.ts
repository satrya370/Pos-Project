import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError } from '../../lib/errors.js'
import { generateInvoiceNumber } from '../../utils/invoice.js'
import { CreateTransactionInput, RecordPaymentInput } from './transactions.types.js'

export async function getTransactions(ownerId: string, startDate?: string, endDate?: string, limit?: number) {
  const where: Record<string, unknown> = { ownerId }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(`${endDate}T23:59:59.999Z`)
  }

  return prisma.transaction.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
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

async function validateProducts(ownerId: string, items: CreateTransactionInput['items']) {
  const uniqueProductIds = [...new Set(items.map(item => item.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, ownerId },
    include: { sizes: true },
  })
  if (products.length !== uniqueProductIds.length) {
    throw new NotFoundError('Salah satu produk tidak ditemukan')
  }
  return new Map(products.map(p => [p.id, p]))
}

function checkStock(productMap: Map<string, { name: string; sizes: { id: string; name: string; stock: number }[] }>, items: CreateTransactionInput['items']) {
  for (const item of items) {
    const product = productMap.get(item.productId)!
    const size = product.sizes.find(s => s.id === item.productSizeId)
    if (!size) {
      throw new NotFoundError(`Ukuran ${item.productSizeId} tidak ditemukan untuk produk ${product.name}`)
    }
    if (size.stock < item.quantity) {
      throw new BadRequestError(`Stok ${product.name} ukuran ${size.name} tidak cukup (tersisa ${size.stock})`)
    }
  }
}

function buildTransactionItems(productMap: Map<string, { sellingPrice: number; purchasePrice: number; name: string; sizes: { id: string; name: string }[] }>, items: CreateTransactionInput['items']) {
  let totalAmount = 0
  let totalCost = 0
  const transactionItems = items.map(item => {
    const product = productMap.get(item.productId)!
    const size = product.sizes.find(s => s.id === item.productSizeId)
    const discountAmount = product.sellingPrice * item.quantity * (item.discountPercent / 100)
    const subtotal = product.sellingPrice * item.quantity - discountAmount
    totalAmount += subtotal
    totalCost += product.purchasePrice * item.quantity
    return {
      productId: item.productId,
      productSizeId: item.productSizeId,
      productName: product.name,
      size: size?.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      costAtPurchase: product.purchasePrice,
      discountPercent: item.discountPercent,
      discountAmount,
      subtotal,
    }
  })
  return { transactionItems, totalAmount, totalCost }
}

async function updateStockAndMovements(items: CreateTransactionInput['items'], transactionId: string, invoiceNumber: string) {
  for (const item of items) {
    await prisma.productSize.update({
      where: { id: item.productSizeId },
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
  const productMap = await validateProducts(ownerId, input.items)
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
      customerId:    input.customerId ?? null,
      customerName:  input.customerName ?? null,
      paymentStatus: input.paymentStatus ?? 'paid',
      items: { create: transactionItems },
    },
    include: { items: true },
  })

  await updateStockAndMovements(input.items, transaction.id, invoiceNumber)
  return transaction
}

async function restoreStock(items: { productId: string | null; productSizeId: string | null; quantity: number }[], transactionId: string, invoiceNumber: string) {
  for (const item of items) {
    if (!item.productId || !item.productSizeId) continue
    await prisma.productSize.update({
      where: { id: item.productSizeId },
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

export async function getDebts(ownerId: string) {
  return prisma.transaction.findMany({
    where: { ownerId, paymentStatus: 'credit', status: 'completed' },
    include: {
      items: true,
      debtPayments: { orderBy: { paidAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function recordDebtPayment(ownerId: string, transactionId: string, input: RecordPaymentInput) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, ownerId, paymentStatus: 'credit' },
    include: { debtPayments: true },
  })
  if (!transaction) throw new NotFoundError('Transaksi kredit tidak ditemukan')

  const alreadyPaid = transaction.debtPayments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = transaction.totalAmount - alreadyPaid
  if (input.amount > remaining + 0.001) {
    throw new BadRequestError(`Jumlah melebihi sisa hutang (Rp ${remaining.toLocaleString('id-ID')})`)
  }

  const payment = await prisma.debtPayment.create({
    data: { transactionId, amount: input.amount, notes: input.notes ?? null },
  })

  if (input.amount >= remaining - 0.001) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { paymentStatus: 'paid' },
    })
  }
  return payment
}
