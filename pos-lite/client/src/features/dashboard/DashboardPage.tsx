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
import { BarChart3, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
