import { useQuery } from '@tanstack/react-query'
import { getPeakTime } from '@/api/reports'
import { Spinner } from '@/components/ui/Spinner'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'

const PRIMARY = '#6366f1'
const PRIMARY_DIM = '#6366f155'

function PeakBar({ data, dataKey, labelKey, tooltipLabel }: {
  data: Record<string, unknown>[]
  dataKey: string
  labelKey: string
  tooltipLabel: string
}) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d[dataKey] as number))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(v: number) => [v, tooltipLabel]}
          labelFormatter={(l) => `${l}`}
        />
        <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={(entry[dataKey] as number) === maxVal ? PRIMARY : PRIMARY_DIM} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PeakTimeCharts({ period }: { period: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'peak-time', period],
    queryFn: () => getPeakTime(period),
  })

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!data) return null

  const hourData = data.byHour
    .filter(h => h.txCount > 0)
    .map(h => ({ ...h, label: `${String(h.hour).padStart(2, '0')}:00` }))

  const dayData = data.byDay.map(d => ({ ...d, label: d.dayName.slice(0, 3) }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Jam Tersibuk</p>
        <p className="text-xs text-gray-400 mb-3">Jumlah transaksi per jam</p>
        {hourData.length === 0
          ? <p className="text-sm text-gray-400 text-center py-6">Belum ada data</p>
          : <PeakBar data={hourData} dataKey="txCount" labelKey="label" tooltipLabel="transaksi" />
        }
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Hari Tersibuk</p>
        <p className="text-xs text-gray-400 mb-3">Jumlah transaksi per hari</p>
        <PeakBar data={dayData} dataKey="txCount" labelKey="label" tooltipLabel="transaksi" />
      </div>
    </div>
  )
}
