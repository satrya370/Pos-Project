import { PeriodComparisonData } from '@/api/reports'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  data: PeriodComparisonData
  period: number
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

function DeltaBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs text-gray-400">N/A</span>
  const isUp = percent >= 0
  const Icon = percent === 0 ? Minus : isUp ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      percent === 0 ? 'bg-gray-100 text-gray-500' :
      isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      <Icon className="h-3 w-3" />
      {Math.abs(percent).toFixed(1)}%
    </span>
  )
}

export function PeriodComparison({ data, period }: Props) {
  const label = period === 1 ? 'kemarin' : `${period} hari sebelumnya`

  const kpis = [
    {
      title: 'Total Revenue',
      current: formatRp(data.current.revenue),
      previous: formatRp(data.previous.revenue),
      delta: data.delta.revenuePercent,
    },
    {
      title: 'Jumlah Transaksi',
      current: data.current.txCount.toLocaleString('id-ID'),
      previous: data.previous.txCount.toLocaleString('id-ID'),
      delta: data.delta.txCountPercent,
    },
    {
      title: 'Rata-rata Nilai Order',
      current: formatRp(data.current.avgOrderValue),
      previous: formatRp(data.previous.avgOrderValue),
      delta: data.delta.avgOrderValuePercent,
    },
  ]

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Perbandingan Periode</p>
      <p className="text-xs text-gray-400 mb-4">Periode ini vs {label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.title} className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">{kpi.title}</p>
            <p className="text-lg font-bold text-gray-800 mb-1">{kpi.current}</p>
            <div className="flex items-center gap-2">
              <DeltaBadge percent={kpi.delta} />
              <span className="text-xs text-gray-400">dari {kpi.previous}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
