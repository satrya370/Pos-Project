import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface TopBarChartProps {
  data: { label: string; value: number }[]
  title: string
  formatValue?: (v: number) => string
  color?: string
}

export function TopBarChart({ data, title, formatValue, color = '#6366f1' }: TopBarChartProps) {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('id-ID'))
  if (data.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
        <p className="text-sm text-gray-400 text-center py-8">Belum ada data</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={color}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? color : `${color}99`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
