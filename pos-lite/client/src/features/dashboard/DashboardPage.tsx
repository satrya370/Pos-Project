import { SummaryCards } from './SummaryCards'
import { TopProducts } from './TopProducts'
import { DailyTargetCard } from './DailyTargetCard'
import { RecentTransactions } from './RecentTransactions'
import { StockSummaryCard } from './StockSummaryCard'
import { SalesChart } from '@/components/charts/SalesChart'
import { LowStockAlert } from '@/features/products/LowStockAlert'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useDailyReport, useWeeklySalesChart } from '@/hooks/useApi'
import { BarChart3, Plus, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getExpiringProducts } from '@/api/products'

function ExpiryAlertCard() {
  const { data: expiring = [] } = useQuery({
    queryKey: ['products', 'expiring', 30],
    queryFn: () => getExpiringProducts(30),
  })

  const expired = expiring.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date())
  const soonExpiring = expiring.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date())

  if (expiring.length === 0) return null

  return (
    <div className="space-y-2">
      {expired.length > 0 && (
        <Card className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">{expired.length} produk sudah kadaluarsa</p>
              <p className="text-xs text-red-600 mt-0.5 truncate">
                {expired.slice(0, 3).map(p => p.name).join(', ')}{expired.length > 3 ? ` +${expired.length - 3} lagi` : ''}
              </p>
            </div>
            <a href="/products?filter=expired" className="text-xs text-red-600 font-medium hover:underline whitespace-nowrap">Lihat →</a>
          </div>
        </Card>
      )}
      {soonExpiring.length > 0 && (
        <Card className="p-4 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-700">{soonExpiring.length} produk hampir kadaluarsa (≤30 hari)</p>
              <p className="text-xs text-yellow-600 mt-0.5 truncate">
                {soonExpiring.slice(0, 3).map(p => p.name).join(', ')}{soonExpiring.length > 3 ? ` +${soonExpiring.length - 3} lagi` : ''}
              </p>
            </div>
            <a href="/products?filter=expiring" className="text-xs text-yellow-600 font-medium hover:underline whitespace-nowrap">Lihat →</a>
          </div>
        </Card>
      )}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: chartData = [], isLoading: isLoadingChart } = useWeeklySalesChart()
  const { data: daily } = useDailyReport()

  return (
    <div className="space-y-6">
      {/* Header + Quick Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Catat Penjualan
        </button>
      </div>

      {/* Expiry Alerts */}
      <ExpiryAlertCard />

      {/* Summary Cards */}
      <SummaryCards />

      {/* Target Harian */}
      <DailyTargetCard todaySales={daily?.totalSales ?? 0} />

      {/* Chart + Stock Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Penjualan 7 Hari Terakhir</h3>
          {isLoadingChart ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <SalesChart data={chartData} />
          )}
        </Card>

        <div className="space-y-4">
          <LowStockAlert />
        </div>
      </div>

      {/* Recent Transactions + Stock Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <RecentTransactions />
        <StockSummaryCard />
      </div>

      {/* Top / Bottom Products */}
      <TopProducts />
    </div>
  )
}
