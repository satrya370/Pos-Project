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
