import api from './client'
import { DailyReport, WeeklyReport, MonthlyReport, TopProductsReport } from '@/types'

export async function getDailyReport(date?: string): Promise<DailyReport> {
  const params = date ? { date } : {}
  const response = await api.get('/reports/daily', { params })
  return response.data.data
}

export async function getWeeklyReport(week?: string): Promise<WeeklyReport> {
  const params = week ? { week } : {}
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
