import { prisma } from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'

function getDateRange(period: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - period)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

async function getTopProducts(
  ownerId: string,
  period: number,
): Promise<{ productId: string; productName: string; totalQty: number; totalRevenue: number }[]> {
  const { start } = getDateRange(period)
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT p.id as productId, p.name as productName,
      CAST(SUM(ti.quantity) AS INTEGER) as totalQty,
      SUM(ti.quantity * ti.unitPrice) as totalRevenue
    FROM TransactionItem ti
    JOIN "Transaction" t ON ti.transactionId = t.id
    JOIN Product p ON ti.productId = p.id
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
    GROUP BY p.id, p.name
    ORDER BY totalQty DESC
    LIMIT 10
  `)
  return (rows as any[]).map(r => ({
    productId: r.productId as string,
    productName: r.productName as string,
    totalQty: Number(r.totalQty),
    totalRevenue: Number(r.totalRevenue),
  }))
}

async function getTopCategories(
  ownerId: string,
  period: number,
): Promise<{ categoryId: string; categoryName: string; totalQty: number; totalRevenue: number }[]> {
  const { start } = getDateRange(period)
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT c.id as categoryId, c.name as categoryName,
      CAST(SUM(ti.quantity) AS INTEGER) as totalQty,
      SUM(ti.quantity * ti.unitPrice) as totalRevenue
    FROM TransactionItem ti
    JOIN "Transaction" t ON ti.transactionId = t.id
    JOIN Product p ON ti.productId = p.id
    LEFT JOIN Category c ON p.categoryId = c.id
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
      AND c.id IS NOT NULL
    GROUP BY c.id, c.name
    ORDER BY totalRevenue DESC
    LIMIT 10
  `)
  return (rows as any[]).map(r => ({
    categoryId: r.categoryId as string,
    categoryName: r.categoryName as string,
    totalQty: Number(r.totalQty),
    totalRevenue: Number(r.totalRevenue),
  }))
}

async function getTopCustomers(
  ownerId: string,
  period: number,
): Promise<{ label: string; txCount: number; totalSpend: number }[]> {
  const { start } = getDateRange(period)
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      COALESCE(t.customerId, 'walk-in-' || COALESCE(t.customerName, 'Walk-in')) as customerId,
      COALESCE(t.customerName, 'Walk-in') as label,
      COUNT(*) as txCount,
      SUM(t.totalAmount) as totalSpend
    FROM "Transaction" t
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
      AND (t.customerId IS NOT NULL OR t.customerName IS NOT NULL)
    GROUP BY COALESCE(t.customerId, t.customerName)
    ORDER BY totalSpend DESC
    LIMIT 10
  `)
  return (rows as any[]).map(r => ({
    label: r.label as string,
    txCount: Number(r.txCount),
    totalSpend: Number(r.totalSpend),
  }))
}

async function getTopProductsByCategory(
  ownerId: string,
  period: number,
  categoryId?: string,
): Promise<{ productId: string; productName: string; categoryName: string; totalQty: number }[]> {
  const { start } = getDateRange(period)

  if (categoryId) {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.id as productId, p.name as productName,
        c.name as categoryName,
        CAST(SUM(ti.quantity) AS INTEGER) as totalQty
      FROM TransactionItem ti
      JOIN "Transaction" t ON ti.transactionId = t.id
      JOIN Product p ON ti.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      WHERE t.ownerId = ${ownerId}
        AND t.status = 'completed'
        AND t.createdAt >= ${start.toISOString()}
        AND p.categoryId = ${categoryId}
      GROUP BY p.id, p.name, c.name
      ORDER BY totalQty DESC
      LIMIT 10
    `)
    return (rows as any[]).map(r => ({
      productId: r.productId as string,
      productName: r.productName as string,
      categoryName: r.categoryName as string,
      totalQty: Number(r.totalQty),
    }))
  }

  // No categoryId: top 5 products per top 5 categories by revenue
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT p.id as productId, p.name as productName,
      c.name as categoryName,
      CAST(SUM(ti.quantity) AS INTEGER) as totalQty
    FROM TransactionItem ti
    JOIN "Transaction" t ON ti.transactionId = t.id
    JOIN Product p ON ti.productId = p.id
    LEFT JOIN Category c ON p.categoryId = c.id
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
      AND c.id IS NOT NULL
    GROUP BY p.id, p.name, c.name
    ORDER BY totalQty DESC
    LIMIT 20
  `)

  // Keep top 5 per category, using only top 5 categories
  const categoryMap = new Map<string, { productId: string; productName: string; categoryName: string; totalQty: number }[]>()
  for (const r of rows as any[]) {
    const catName = r.categoryName as string
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, [])
    }
    const list = categoryMap.get(catName)!
    if (list.length < 5) {
      list.push({
        productId: r.productId as string,
        productName: r.productName as string,
        categoryName: catName,
        totalQty: Number(r.totalQty),
      })
    }
  }

  // Take top 5 categories and flatten
  const result: { productId: string; productName: string; categoryName: string; totalQty: number }[] = []
  let catCount = 0
  for (const [, products] of categoryMap) {
    if (catCount >= 5) break
    result.push(...products)
    catCount++
  }
  return result
}

async function getTopBundles(
  ownerId: string,
  period: number,
): Promise<{ productAName: string; productBName: string; frequency: number; badge: 'strong' | 'moderate' | 'weak' }[]> {
  const { start } = getDateRange(period)
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      pa.name as productAName,
      pb.name as productBName,
      CAST(COUNT(*) AS INTEGER) as frequency
    FROM TransactionItem a
    JOIN TransactionItem b
      ON a.transactionId = b.transactionId AND a.productId < b.productId
    JOIN "Transaction" t ON a.transactionId = t.id
    JOIN Product pa ON a.productId = pa.id
    JOIN Product pb ON b.productId = pb.id
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
    GROUP BY a.productId, b.productId
    ORDER BY frequency DESC
    LIMIT 10
  `)

  function getBadge(freq: number): 'strong' | 'moderate' | 'weak' {
    if (freq >= 5) return 'strong'
    if (freq >= 2) return 'moderate'
    return 'weak'
  }

  return (rows as any[]).map(r => ({
    productAName: r.productAName as string,
    productBName: r.productBName as string,
    frequency: Number(r.frequency),
    badge: getBadge(Number(r.frequency)),
  }))
}

export async function getAnalytics(ownerId: string, period: number, categoryId?: string) {
  const [topProducts, topCategories, topCustomers, topProductsByCategory, topBundles] =
    await Promise.all([
      getTopProducts(ownerId, period),
      getTopCategories(ownerId, period),
      getTopCustomers(ownerId, period),
      getTopProductsByCategory(ownerId, period, categoryId),
      getTopBundles(ownerId, period),
    ])
  return { topProducts, topCategories, topCustomers, topProductsByCategory, topBundles }
}

export async function getProfitMargin(ownerId: string, period: number) {
  const { start } = getDateRange(period)
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      p.id as productId,
      p.name as productName,
      COALESCE(c.name, 'Tanpa Kategori') as categoryName,
      p.purchasePrice as costPrice,
      AVG(ti.unitPrice) as avgSellingPrice,
      CAST(SUM(ti.quantity) AS INTEGER) as totalQty,
      SUM(ti.quantity * ti.unitPrice) as totalRevenue,
      SUM(ti.quantity * (ti.unitPrice - p.purchasePrice)) as totalProfit,
      CASE WHEN AVG(ti.unitPrice) > 0 AND p.purchasePrice > 0
        THEN (AVG(ti.unitPrice) - p.purchasePrice) / AVG(ti.unitPrice) * 100
        ELSE NULL
      END as marginPercent
    FROM TransactionItem ti
    JOIN "Transaction" t ON ti.transactionId = t.id
    JOIN Product p ON ti.productId = p.id
    LEFT JOIN Category c ON p.categoryId = c.id
    WHERE t.ownerId = ${ownerId}
      AND t.status = 'completed'
      AND t.createdAt >= ${start.toISOString()}
    GROUP BY p.id, p.name, c.name, p.purchasePrice
    ORDER BY marginPercent DESC NULLS LAST
    LIMIT 20
  `)

  return (rows as any[]).map(r => ({
    productId: r.productId as string,
    productName: r.productName as string,
    categoryName: r.categoryName as string,
    costPrice: Number(r.costPrice),
    avgSellingPrice: Number(r.avgSellingPrice),
    totalQty: Number(r.totalQty),
    totalRevenue: Number(r.totalRevenue),
    totalProfit: Number(r.totalProfit),
    marginPercent: r.marginPercent != null ? Number(r.marginPercent) : null,
  }))
}

export async function getPeriodComparison(ownerId: string, period: number) {
  const now = new Date()

  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - period)
  currentStart.setHours(0, 0, 0, 0)

  const previousEnd = new Date(currentStart)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousStart.getDate() - period)
  previousStart.setHours(0, 0, 0, 0)

  const [current, previous] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ownerId,
        status: 'completed',
        createdAt: { gte: currentStart, lte: now },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ownerId,
        status: 'completed',
        createdAt: { gte: previousStart, lt: previousEnd },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    }),
  ])

  const curRevenue = current._sum.totalAmount ?? 0
  const prevRevenue = previous._sum.totalAmount ?? 0
  const curTx = current._count.id
  const prevTx = previous._count.id
  const curAvg = current._avg.totalAmount ?? 0
  const prevAvg = previous._avg.totalAmount ?? 0

  const delta = (cur: number, prev: number): number | null =>
    prev === 0 ? null : ((cur - prev) / prev) * 100

  return {
    current:  { revenue: curRevenue,  txCount: curTx,  avgOrderValue: curAvg },
    previous: { revenue: prevRevenue, txCount: prevTx, avgOrderValue: prevAvg },
    delta: {
      revenuePercent:       delta(curRevenue, prevRevenue),
      txCountPercent:       delta(curTx, prevTx),
      avgOrderValuePercent: delta(curAvg, prevAvg),
    },
  }
}
