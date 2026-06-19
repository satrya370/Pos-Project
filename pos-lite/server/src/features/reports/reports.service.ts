import { prisma } from '../../lib/prisma.js'
import { DailyReport, WeeklyReport, MonthlyReport, TopProductsReport, ProductRank, Comparison } from './reports.types.js'

function getStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

function getEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}

function getDefaultDate(): string {
  const d = new Date()
  return formatDateStr(d)
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcComparison(current: number, previous: number): Comparison {
  const amount = current - previous
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((amount / previous) * 100)
  return { amount, percent }
}

function aggregateTransactions(transactions: { totalAmount: number; totalCost: number; profit: number; itemsCount: number }[]) {
  return transactions.reduce(
    (acc, t) => ({
      totalSales: acc.totalSales + t.totalAmount,
      totalCost: acc.totalCost + t.totalCost,
      profit: acc.profit + t.profit,
      transactionsCount: acc.transactionsCount + 1,
      itemsSold: acc.itemsSold + t.itemsCount,
    }),
    { totalSales: 0, totalCost: 0, profit: 0, transactionsCount: 0, itemsSold: 0 },
  )
}

function buildProductMap(items: { productId: string | null; productName: string; quantity: number; subtotal: number }[]): Map<string, ProductRank> {
  const map = new Map<string, ProductRank>()
  for (const item of items) {
    if (!item.productId) continue
    const existing = map.get(item.productId)
    if (existing) {
      existing.quantity += item.quantity
      existing.revenue += item.subtotal
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        revenue: item.subtotal,
      })
    }
  }
  return map
}

async function getTopProductsForPeriod(ownerId: string, start: Date, end: Date, limit: number): Promise<ProductRank[]> {
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' } },
  })
  return Array.from(buildProductMap(items).values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

async function getBottomProductsForPeriod(ownerId: string, start: Date, end: Date, limit: number): Promise<ProductRank[]> {
  const [items, allProducts] = await Promise.all([
    prisma.transactionItem.findMany({
      where: { transaction: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' } },
    }),
    prisma.product.findMany({ where: { ownerId }, select: { id: true, name: true } }),
  ])

  const soldMap = buildProductMap(items)

  return allProducts
    .map(p => soldMap.get(p.id) ?? { productId: p.id, productName: p.name, quantity: 0, revenue: 0 })
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, limit)
}

export async function getDailyReport(ownerId: string, date?: string): Promise<DailyReport> {
  const dateStr = date || getDefaultDate()
  const start = getStartOfDay(dateStr)
  const end = getEndOfDay(dateStr)

  const yesterdayDate = new Date(dateStr)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = formatDateStr(yesterdayDate)
  const yesterdayStart = getStartOfDay(yesterdayStr)
  const yesterdayEnd = getEndOfDay(yesterdayStr)

  const [transactions, yesterdayTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' },
      include: { items: true },
    }),
    prisma.transaction.findMany({
      where: { ownerId, createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: 'completed' },
    }),
  ])

  const agg = aggregateTransactions(transactions)
  const yesterdayAgg = aggregateTransactions(yesterdayTransactions)
  const topProducts = await getTopProductsForPeriod(ownerId, start, end, 5)

  return {
    date: dateStr,
    ...agg,
    topProducts,
    comparison: {
      sales: calcComparison(agg.totalSales, yesterdayAgg.totalSales),
      profit: calcComparison(agg.profit, yesterdayAgg.profit),
      transactions: calcComparison(agg.transactionsCount, yesterdayAgg.transactionsCount),
    },
  }
}

// Accept any YYYY-MM-DD date string, finds the Monday-start ISO week containing that date
export async function getWeeklyReport(ownerId: string, date?: string): Promise<WeeklyReport> {
  const d = date ? new Date(`${date}T00:00:00.000Z`) : new Date()
  const startOfWeek = new Date(d)
  const dow = d.getUTCDay() // 0=Sun, 1=Mon...6=Sat
  startOfWeek.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1))

  const dailyBreakdown = []
  let totalSales = 0
  let totalProfit = 0
  let totalTransactions = 0

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setUTCDate(startOfWeek.getUTCDate() + i)
    const dayStr = formatDateStr(day)
    const dayStart = getStartOfDay(dayStr)
    const dayEnd = getEndOfDay(dayStr)

    const txns = await prisma.transaction.findMany({
      where: { ownerId, createdAt: { gte: dayStart, lte: dayEnd }, status: 'completed' },
    })
    const agg = aggregateTransactions(txns)

    dailyBreakdown.push({
      date: dayStr,
      totalSales: agg.totalSales,
      profit: agg.profit,
      transactionsCount: agg.transactionsCount,
    })
    totalSales += agg.totalSales
    totalProfit += agg.profit
    totalTransactions += agg.transactionsCount
  }

  const weekStr = `${startOfWeek.getUTCFullYear()}-W${String(getISOWeek(startOfWeek)).padStart(2, '0')}`
  return { week: weekStr, dailyBreakdown, totalSales, totalProfit, totalTransactions }
}

// ISO week number helper
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export async function getMonthlyReport(ownerId: string, month?: string): Promise<MonthlyReport> {
  const d = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date()
  const year = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`

  const start = new Date(Date.UTC(year, m, 1))
  const end = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999))

  // Direct query for accurate totals (avoids double-counting at month boundaries)
  const transactions = await prisma.transaction.findMany({
    where: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' },
  })
  const agg = aggregateTransactions(transactions)

  // Weekly breakdown for chart display
  const weeklyBreakdown: WeeklyReport[] = []
  let currentWeekStart = new Date(start)
  const seen = new Set<string>()

  while (currentWeekStart <= end) {
    const dateStr = formatDateStr(currentWeekStart)
    if (!seen.has(dateStr)) {
      seen.add(dateStr)
      const weekReport = await getWeeklyReport(ownerId, dateStr)
      weeklyBreakdown.push(weekReport)
    }
    currentWeekStart = new Date(currentWeekStart)
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7)
  }

  return {
    month: monthStr,
    weeklyBreakdown,
    totalSales: agg.totalSales,
    totalProfit: agg.profit,
    totalTransactions: agg.transactionsCount,
  }
}

export async function getTopProducts(ownerId: string, period?: string): Promise<TopProductsReport> {
  const days = period === '7d' ? 7 : 30
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)

  const [top, bottom] = await Promise.all([
    getTopProductsForPeriod(ownerId, start, end, 5),
    getBottomProductsForPeriod(ownerId, start, end, 5),
  ])

  return { period: `${days}d`, top, bottom }
}
