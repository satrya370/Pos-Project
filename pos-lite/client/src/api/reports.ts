import api from './client'
import { DailyReport, WeeklyReport, MonthlyReport, TopProductsReport } from '@/types'

export async function getDailyReport(date?: string): Promise<DailyReport> {
  const params = date ? { date } : {}
  const response = await api.get('/reports/daily', { params })
  return response.data.data
}

export async function getWeeklyReport(date?: string): Promise<WeeklyReport> {
  const params = date ? { date } : {}
  const response = await api.get('/reports/weekly', { params })
  return response.data.data
}

export async function getMonthlyReport(month?: string): Promise<MonthlyReport> {
  const params = month ? { month } : {}
  const response = await api.get('/reports/monthly', { params })
  return response.data.data
}

export async function getTopProducts(period?: string): Promise<TopProductsReport> {
  const params = period ? { period } : {}
  const response = await api.get('/reports/top-products', { params })
  return response.data.data
}

export interface AnalyticsData {
  topProducts: { productId: string; productName: string; totalQty: number; totalRevenue: number }[]
  topCategories: { categoryId: string; categoryName: string; totalQty: number; totalRevenue: number }[]
  topCustomers: { label: string; txCount: number; totalSpend: number }[]
  topProductsByCategory: { productId: string; productName: string; categoryName: string; totalQty: number }[]
  topBundles: { productAName: string; productBName: string; frequency: number; badge: 'strong' | 'moderate' | 'weak' }[]
}

export async function getAnalytics(period: number, categoryId?: string): Promise<AnalyticsData> {
  const params: Record<string, string> = { period: String(period) }
  if (categoryId) params.categoryId = categoryId
  const response = await api.get('/reports/analytics', { params })
  return response.data.data
}

export interface ProfitMarginItem {
  productId: string
  productName: string
  categoryName: string
  costPrice: number
  avgSellingPrice: number
  totalQty: number
  totalRevenue: number
  totalProfit: number
  marginPercent: number | null  // null = no purchase price data
}

export interface PeriodComparisonData {
  current:  { revenue: number; txCount: number; avgOrderValue: number }
  previous: { revenue: number; txCount: number; avgOrderValue: number }
  delta: {
    revenuePercent:       number | null
    txCountPercent:       number | null
    avgOrderValuePercent: number | null
  }
}

export async function getProfitMargin(period: number): Promise<ProfitMarginItem[]> {
  const response = await api.get('/reports/profit-margin', { params: { period } })
  return response.data.data
}

export async function getPeriodComparison(period: number): Promise<PeriodComparisonData> {
  const response = await api.get('/reports/comparison', { params: { period } })
  return response.data.data
}

export interface DeadStockItem {
  productId: string
  productName: string
  categoryName: string
  currentStock: number
  lastSoldAt: string | null
  daysSinceLastSale: number | null
}

export interface PeakTimeData {
  byHour: { hour: number; txCount: number; revenue: number }[]
  byDay: { day: number; dayName: string; txCount: number; revenue: number }[]
}

export async function getDeadStock(threshold: number): Promise<DeadStockItem[]> {
  const response = await api.get('/reports/dead-stock', { params: { threshold } })
  return response.data.data
}

export async function getPeakTime(period: number): Promise<PeakTimeData> {
  const response = await api.get('/reports/peak-time', { params: { period } })
  return response.data.data
}

export async function exportReport(
  type: 'daily' | 'monthly',
  format: 'pdf' | 'excel',
  params: { date?: string; month?: string }
): Promise<void> {
  const qs = new URLSearchParams({ type, format, ...params })
  const res = await api.get(`/reports/export?${qs}`, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: res.headers['content-type'] as string | undefined })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const disposition = res.headers['content-disposition'] as string | undefined
  a.download = disposition?.split('filename=')[1]?.replace(/"/g, '')
    || `laporan.${format === 'pdf' ? 'pdf' : 'xlsx'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
