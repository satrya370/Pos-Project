import { useState } from 'react'
import { TopBarChart } from './TopBarChart'
import { AnalyticsData } from '@/api/reports'

interface Props {
  data: AnalyticsData['topProductsByCategory']
}

export function TopProductsByCategory({ data }: Props) {
  // Get unique categories from data
  const categories = Array.from(new Set(data.map(d => d.categoryName))).filter(Boolean)
  const [selected, setSelected] = useState<string>('all')

  const filtered = selected === 'all'
    ? data
    : data.filter(d => d.categoryName === selected)

  const chartData = filtered.slice(0, 10).map(d => ({
    label: selected === 'all' ? `${d.productName} (${d.categoryName})` : d.productName,
    value: d.totalQty,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Top Produk per Kategori</p>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <TopBarChart
        data={chartData}
        title=""
        formatValue={v => `${v} pcs`}
        color="#10b981"
      />
    </div>
  )
}
