import { prisma } from '../../lib/prisma.js'
import { DailyReport, WeeklyReport, MonthlyReport, TopProductsReport, ProductRank } from './reports.types.js'

function getStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

function getEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}

function getDefaultDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function mergeProductRanks(accumulator: Map<string, ProductRank>, item: { productId: string | null; productName: string; quantity: number; subtotal: number }) {
  if (!item.productId) return
  const existing = accumulator.get(item.productId)
  if (existing) {
    existing.quantity += item.quantity
    existing.revenue += item.subtotal
  } else {
    accumulator.set(item.productId, {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      revenue: item.subtotal,
    })
  }
}

async function getTopProductsForPeriod(ownerId: string, start: Date, end: Date, limit: number): Promise<ProductRank[]> {
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' } },
    orderBy: { quantity: 'desc' },
  })

  const productMap = new Map<string, ProductRank>()
  items.forEach(item => mergeProductRanks(productMap, item))

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

export async function getDailyReport(ownerId: string, date?: string): Promise<DailyReport> {
  const dateStr = date || getDefaultDate()
  const start = getStartOfDay(dateStr)
  const end = getEndOfDay(dateStr)

  const transactions = await prisma.transaction.findMany({
    where: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' },
    include: { items: true },
  })

  const agg = aggregateTransactions(transactions)
  const topProducts = await getTopProductsForPeriod(ownerId, start, end, 5)

  return { date: dateStr, ...agg, topProducts }
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function buildDailyBreakdown(ownerId: string, startOfWeek: Date) {
  const dailyBreakdown = []
  let totalSales = 0
  let totalProfit = 0
  let totalTransactions = 0

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    const dayReport = await getDailyReport(ownerId, formatDateStr(day))
    dailyBreakdown.push({ date: formatDateStr(day), totalSales: dayReport.totalSales, profit: dayReport.profit, transactionsCount: dayReport.transactionsCount })
    totalSales += dayReport.totalSales
    totalProfit += dayReport.profit
    totalTransactions += dayReport.transactionsCount
  }

  return { dailyBreakdown, totalSales, totalProfit, totalTransactions }
}

export async function getWeeklyReport(ownerId: string, week?: string): Promise<WeeklyReport> {
  const d = week ? new Date(week) : new Date()
  const startOfWeek = new Date(d)
  startOfWeek.setDate(d.getDate() - d.getDay())

  const { dailyBreakdown, totalSales, totalProfit, totalTransactions } = await buildDailyBreakdown(ownerId, startOfWeek)
  const weekStr = `${startOfWeek.getFullYear()}-W${String(Math.ceil((startOfWeek.getDate() + 1) / 7)).padStart(2, '0')}`

  return { week: weekStr, dailyBreakdown, totalSales, totalProfit, totalTransactions }
}

async function buildWeeklyBreakdown(ownerId: string, year: number, month: number) {
  const weeklyBreakdown = []
  let totalSales = 0
  let totalProfit = 0
  let totalTransactions = 0

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let currentWeekStart = new Date(firstDay)

  while (currentWeekStart <= lastDay) {
    const weekReport = await getWeeklyReport(ownerId, currentWeekStart.toISOString())
    weeklyBreakdown.push(weekReport)
    totalSales += weekReport.totalSales
    totalProfit += weekReport.totalProfit
    totalTransactions += weekReport.totalTransactions
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  }

  return { weeklyBreakdown, totalSales, totalProfit, totalTransactions }
}

export async function getMonthlyReport(ownerId: string, month?: string): Promise<MonthlyReport> {
  const d = month ? new Date(`${month}-01`) : new Date()
  const year = d.getFullYear()
  const m = d.getMonth()
  const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`

  const { weeklyBreakdown, totalSales, totalProfit, totalTransactions } = await buildWeeklyBreakdown(ownerId, year, m)

  return { month: monthStr, weeklyBreakdown, totalSales, totalProfit, totalTransactions }
}

export async function getTopProducts(ownerId: string, period?: string): Promise<TopProductsReport> {
  const days = period === '7d' ? 7 : 30
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)

  const topProducts = await getTopProductsForPeriod(ownerId, start, end, 10)
  const bottomProducts = [...topProducts].reverse()

  return { period: `${days}d`, top: topProducts, bottom: bottomProducts }
}
