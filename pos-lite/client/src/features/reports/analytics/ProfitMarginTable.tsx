import { useState } from 'react'
import { ProfitMarginItem } from '@/api/reports'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  data: ProfitMarginItem[]
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

type SortKey = 'marginPercent' | 'totalProfit' | 'totalRevenue' | 'totalQty'

export function ProfitMarginTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('marginPercent')
  const [sortAsc, setSortAsc] = useState(false)

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity
    const bv = b[sortKey] ?? -Infinity
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null :
    sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />

  const thClass = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Belum ada data penjualan</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className={thClass}>Produk</th>
            <th className={thClass}>Kategori</th>
            <th className={`${thClass} text-right`} onClick={() => handleSort('marginPercent')}>
              Margin% <SortIcon k="marginPercent" />
            </th>
            <th className={`${thClass} text-right`}>Harga Jual</th>
            <th className={`${thClass} text-right`}>Harga Beli</th>
            <th className={`${thClass} text-right`} onClick={() => handleSort('totalProfit')}>
              Total Profit <SortIcon k="totalProfit" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort('totalQty')}>
              Qty <SortIcon k="totalQty" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(row => {
            const isLowMargin = row.marginPercent !== null && row.marginPercent < 20
            const isNoData = row.marginPercent === null
            return (
              <tr
                key={row.productId}
                className={isNoData ? 'bg-gray-50' : isLowMargin ? 'bg-red-50' : ''}
              >
                <td className="px-3 py-2 font-medium text-gray-800">{row.productName}</td>
                <td className="px-3 py-2 text-gray-500">{row.categoryName}</td>
                <td className="px-3 py-2 text-right">
                  {row.marginPercent !== null ? (
                    <span className={`font-semibold ${isLowMargin ? 'text-red-600' : 'text-green-600'}`}>
                      {row.marginPercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Belum ada HPP</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{formatRp(row.avgSellingPrice)}</td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {row.costPrice > 0 ? formatRp(row.costPrice) : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">{formatRp(row.totalProfit)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{row.totalQty}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2 px-1">
        * Baris merah: margin &lt;20% &nbsp;|&nbsp; "Belum ada HPP": harga beli belum diisi di data produk
      </p>
    </div>
  )
}
