import { useQuery } from '@tanstack/react-query'
import { getDailyReport, getWeeklyReport, getMonthlyReport, getTopProducts } from '@/api/reports'
import { getLowStockProducts } from '@/api/products'
import { format } from 'date-fns'

export function useDailyReport(date?: string) {
  const reportDate = date || format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['reports', 'daily', reportDate],
    queryFn: () => getDailyReport(reportDate),
  })
}

export function useWeeklyReport(week?: string) {
  const reportWeek = week || format(new Date(), "yyyy-'W'II")
  return useQuery({
    queryKey: ['reports', 'weekly', reportWeek],
    queryFn: () => getWeeklyReport(reportWeek),
  })
}

export function useMonthlyReport(month?: string) {
  const reportMonth = month || format(new Date(), 'yyyy-MM')
  return useQuery({
    queryKey: ['reports', 'monthly', reportMonth],
    queryFn: () => getMonthlyReport(reportMonth),
  })
}

export function useTopProducts(period?: string) {
  const reportPeriod = period || 'monthly'
  return useQuery({
    queryKey: ['reports', 'top-products', reportPeriod],
    queryFn: () => getTopProducts(reportPeriod),
  })
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: getLowStockProducts,
  })
}

export function useWeeklySalesChart() {
  return useQuery({
    queryKey: ['reports', 'weekly-chart'],
    queryFn: async () => {
      const week = format(new Date(), "yyyy-'W'II")
      const report = await getWeeklyReport(week)
      return report.dailyBreakdown.map((day) => ({
        date: format(new Date(day.date), 'EEE'),
        sales: day.totalSales,
        profit: day.profit,
      }))
    },
  })
}
