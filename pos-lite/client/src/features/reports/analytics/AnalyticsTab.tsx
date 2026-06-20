import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalytics, getProfitMargin, getPeriodComparison } from '@/api/reports'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { TopBarChart } from './TopBarChart'
import { TopProductsByCategory } from './TopProductsByCategory'
import { TopBundleList } from './TopBundleList'
import { PeriodComparison } from './PeriodComparison'
import { ProfitMarginTable } from './ProfitMarginTable'
import { DeadStockTable } from './DeadStockTable'
import { PeakTimeCharts } from './PeakTimeCharts'

type Period = 1 | 7 | 30

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export function AnalyticsTab() {
  const [period, setPeriod] = useState<Period>(7)

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'analytics', period],
    queryFn: () => getAnalytics(period),
  })

  const { data: marginData, isLoading: isLoadingMargin } = useQuery({
    queryKey: ['reports', 'profit-margin', period],
    queryFn: () => getProfitMargin(period),
  })

  const { data: comparisonData } = useQuery({
    queryKey: ['reports', 'comparison', period],
    queryFn: () => getPeriodComparison(period),
  })

  const periodLabel = period === 1 ? 'hari ini' : `${period} hari terakhir`

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Periode:</span>
        {([1, 7, 30] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors min-h-[40px] ${
              period === p
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 1 ? 'Hari Ini' : `${p} Hari`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Phase 1 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Top Kategori */}
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-3">({periodLabel})</p>
              <TopBarChart
                title="Top Kategori"
                data={data.topCategories.map(d => ({ label: d.categoryName, value: d.totalRevenue }))}
                formatValue={formatRp}
                color="#f59e0b"
              />
            </Card>

            {/* Top Customer */}
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-3">({periodLabel})</p>
              <TopBarChart
                title="Top Customer"
                data={data.topCustomers.map(d => ({ label: d.label, value: d.totalSpend }))}
                formatValue={formatRp}
                color="#10b981"
              />
            </Card>

            {/* Top Produk per Kategori */}
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-3">({periodLabel})</p>
              <TopProductsByCategory data={data.topProductsByCategory} />
            </Card>

            {/* Top Bundle — full width */}
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Top Bundle — Sering Dibeli Bersama</p>
                  <p className="text-xs text-gray-400">({periodLabel})</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Sering (≥5x)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Kadang (2-4x)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Jarang (1x)
                  </span>
                </div>
              </div>
              <TopBundleList data={data.topBundles} />
            </Card>
          </div>

          {/* Phase 2 — Period Comparison */}
          {comparisonData && (
            <Card className="p-5">
              <PeriodComparison data={comparisonData} period={period} />
            </Card>
          )}

          {/* Phase 2 — Profit Margin */}
          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Margin & Profit per Produk</p>
            <p className="text-xs text-gray-400 mb-4">({periodLabel})</p>
            {isLoadingMargin ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <ProfitMarginTable data={marginData ?? []} />
            )}
          </Card>

          {/* Phase 3 — Peak Time */}
          <Card className="p-5">
            <PeakTimeCharts period={period} />
          </Card>

          {/* Phase 3 — Dead Stock */}
          <Card className="p-5">
            <DeadStockTable period={period} />
          </Card>
        </div>
      )}
    </div>
  )
}
