import { Card } from '@/components/ui/Card'
import { useDailyReport, useWeeklyReport, useMonthlyReport } from '@/hooks/useApi'
import { BarChart3, Calendar, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import type { Comparison } from '@/types'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

function ComparisonBadge({ comparison, label }: { comparison: Comparison; label: string }) {
  const isPositive = comparison.amount >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  const color = isPositive ? 'text-success' : 'text-danger'
  const sign = isPositive ? '+' : ''

  return (
    <p className={`text-xs flex items-center gap-1 mt-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {sign}{formatPrice(Math.abs(comparison.amount))} ({sign}{comparison.percent}%) {label}
    </p>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color?: string
  isLoading?: boolean
  comparison?: Comparison
  comparisonLabel?: string
  meta?: string
}

function StatCard({ title, value, icon, color = 'text-gray-600', isLoading, comparison, comparisonLabel, meta }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          {isLoading ? (
            <div className="space-y-1">
              <div className="h-7 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
              {comparison && comparisonLabel && (
                <ComparisonBadge comparison={comparison} label={comparisonLabel} />
              )}
              {meta && <p className="text-xs text-gray-400 mt-1">{meta}</p>}
            </>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-50 ${color} shrink-0 ml-2`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function SummaryCards() {
  const { data: daily, isLoading: isLoadingDaily } = useDailyReport()
  const { data: weekly, isLoading: isLoadingWeekly } = useWeeklyReport()
  const { data: monthly, isLoading: isLoadingMonthly } = useMonthlyReport()

  const todaySales = daily?.totalSales ?? 0
  const weekSales = weekly?.totalSales ?? 0
  const monthSales = monthly?.totalSales ?? 0
  const monthProfit = monthly?.totalProfit ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="Penjualan Hari Ini"
        value={formatPrice(todaySales)}
        icon={<BarChart3 className="h-6 w-6" />}
        color="text-primary"
        isLoading={isLoadingDaily}
        comparison={daily?.comparison.sales}
        comparisonLabel="vs kemarin"
        meta={daily ? `${daily.transactionsCount} transaksi · ${daily.itemsSold} item` : undefined}
      />
      <StatCard
        title="Penjualan Minggu Ini"
        value={formatPrice(weekSales)}
        icon={<Calendar className="h-6 w-6" />}
        color="text-blue-600"
        isLoading={isLoadingWeekly}
        meta={weekly ? `${weekly.totalTransactions} transaksi` : undefined}
      />
      <StatCard
        title="Penjualan Bulan Ini"
        value={formatPrice(monthSales)}
        icon={<ShoppingCart className="h-6 w-6" />}
        color="text-indigo-600"
        isLoading={isLoadingMonthly}
        meta={monthly ? `${monthly.totalTransactions} transaksi` : undefined}
      />
      <StatCard
        title="Profit Bulan Ini"
        value={formatPrice(monthProfit)}
        icon={<DollarSign className="h-6 w-6" />}
        color="text-success"
        isLoading={isLoadingMonthly}
        meta={monthly ? `Hari ini: ${formatPrice(daily?.profit ?? 0)}` : undefined}
      />
    </div>
  )
}
