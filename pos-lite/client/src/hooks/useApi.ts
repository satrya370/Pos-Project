import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDailyReport, getWeeklyReport, getMonthlyReport, getTopProducts } from '@/api/reports'
import { getLowStockProducts, getStockSummary } from '@/api/products'
import { getTransactions } from '@/api/transactions'
import { getDailyTarget, updateDailyTarget } from '@/api/auth'
import { format } from 'date-fns'

function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// Returns Monday of the current week as YYYY-MM-DD
function getWeekStartStr(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return format(d, 'yyyy-MM-dd')
}

export function useDailyReport(date?: string) {
  const reportDate = date || getTodayStr()
  return useQuery({
    queryKey: ['reports', 'daily', reportDate],
    queryFn: () => getDailyReport(reportDate),
  })
}

export function useWeeklyReport(date?: string) {
  const weekStart = date || getWeekStartStr()
  return useQuery({
    queryKey: ['reports', 'weekly', weekStart],
    queryFn: () => getWeeklyReport(weekStart),
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
  const reportPeriod = period || '30d'
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

export function useStockSummary() {
  return useQuery({
    queryKey: ['products', 'stock-summary'],
    queryFn: getStockSummary,
  })
}

// Derives chart data from the weekly report — no duplicate fetch
export function useWeeklySalesChart() {
  const { data: weeklyReport, isLoading } = useWeeklyReport()
  const data = weeklyReport?.dailyBreakdown.map(day => ({
    date: format(new Date(day.date + 'T00:00:00'), 'EEE'),
    sales: day.totalSales,
    profit: day.profit,
  })) ?? []
  return { data, isLoading }
}

export function useTodayTransactions(limit?: number) {
  const today = getTodayStr()
  return useQuery({
    queryKey: ['transactions', 'today', limit],
    queryFn: () => getTransactions(today, today, limit),
  })
}

export function useDailyTarget() {
  return useQuery({
    queryKey: ['owner', 'target'],
    queryFn: getDailyTarget,
  })
}

export function useUpdateDailyTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (target: number) => updateDailyTarget(target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'target'] })
    },
  })
}
