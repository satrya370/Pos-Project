import { AnalyticsData } from '@/api/reports'

interface Props {
  data: AnalyticsData['topBundles']
}

const badgeConfig = {
  strong:   { label: 'Sering',  className: 'bg-green-100 text-green-700' },
  moderate: { label: 'Kadang',  className: 'bg-yellow-100 text-yellow-700' },
  weak:     { label: 'Jarang',  className: 'bg-gray-100 text-gray-500' },
}

export function TopBundleList({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Belum ada data bundle</p>
  }
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const badge = badgeConfig[item.badge]
        return (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <span className="text-sm text-gray-700 truncate">
                <span className="font-medium">{item.productAName}</span>
                <span className="text-gray-400 mx-1">+</span>
                <span className="font-medium">{item.productBName}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                {badge.label}
              </span>
              <span className="text-xs text-gray-500">{item.frequency}x</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
