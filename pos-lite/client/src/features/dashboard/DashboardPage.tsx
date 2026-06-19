import { SummaryCards } from './SummaryCards'
import { TopProducts } from './TopProducts'
import { SalesChart } from '@/components/charts/SalesChart'
import { LowStockAlert } from '@/features/products/LowStockAlert'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useWeeklySalesChart } from '@/hooks/useApi'
import { BarChart3 } from 'lucide-react'

export function DashboardPage() {
  const { data: chartData = [], isLoading: isLoadingChart } = useWeeklySalesChart()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      </div>

      <SummaryCards />

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

      <TopProducts />
    </div>
  )
}
