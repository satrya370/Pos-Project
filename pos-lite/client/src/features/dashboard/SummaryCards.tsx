import { Card } from '@/components/ui/Card'
import { useDailyReport, useWeeklyReport, useMonthlyReport } from '@/hooks/useApi'
import { BarChart3, Calendar, DollarSign, ShoppingCart } from 'lucide-react'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
  isLoading?: boolean
}

function StatCard({ title, value, icon, color = 'text-gray-600', isLoading }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-gray-800">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Penjualan Hari Ini"
        value={formatPrice(todaySales)}
        icon={<BarChart3 className="h-6 w-6" />}
        color="text-primary"
        isLoading={isLoadingDaily}
      />
      <StatCard
        title="Penjualan Minggu Ini"
        value={formatPrice(weekSales)}
        icon={<Calendar className="h-6 w-6" />}
        color="text-blue-600"
        isLoading={isLoadingWeekly}
      />
      <StatCard
        title="Penjualan Bulan Ini"
        value={formatPrice(monthSales)}
        icon={<ShoppingCart className="h-6 w-6" />}
        color="text-indigo-600"
        isLoading={isLoadingMonthly}
      />
      <StatCard
        title="Profit Bulan Ini"
        value={formatPrice(monthProfit)}
        icon={<DollarSign className="h-6 w-6" />}
        color="text-success"
        isLoading={isLoadingMonthly}
      />
    </div>
  )
}
