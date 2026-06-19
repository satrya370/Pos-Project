import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailyReport, getWeeklyReport, getMonthlyReport, getTopProducts, exportReport } from '@/api/reports'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { TrendingUp, TrendingDown, BarChart3, Calendar, Trophy, AlertTriangle, FileDown, FileSpreadsheet } from 'lucide-react'
import { AnalyticsTab } from './analytics/AnalyticsTab'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), "yyyy-'W'II"))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [topPeriod, setTopPeriod] = useState<1|7|30>(7)
  const topPeriodMap: Record<1|7|30, string> = { 1: 'daily', 7: 'weekly', 30: 'monthly' }
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'daily' | 'monthly', fmt: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      if (type === 'daily') {
        await exportReport(type, fmt, { date: selectedDate })
      } else {
        await exportReport(type, fmt, { month: selectedMonth })
      }
    } catch (err) {
      alert('Gagal mengexport laporan')
    } finally {
      setIsExporting(false)
    }
  }

  const { data: dailyReport, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['reports', 'daily', selectedDate],
    queryFn: () => getDailyReport(selectedDate),
    enabled: activeTab === 'daily',
  })

  const { data: weeklyReport, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['reports', 'weekly', selectedWeek],
    queryFn: () => getWeeklyReport(selectedWeek),
    enabled: activeTab === 'weekly',
  })

  const { data: monthlyReport, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['reports', 'monthly', selectedMonth],
    queryFn: () => getMonthlyReport(selectedMonth),
    enabled: activeTab === 'monthly',
  })

  const { data: topProducts, isLoading: isLoadingTop } = useQuery({
    queryKey: ['reports', 'top-products', topPeriod],
    queryFn: () => getTopProducts(topPeriodMap[topPeriod]),
    enabled: activeTab === 'top-products',
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Laporan</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="weekly">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
          <TabsTrigger value="top-products">Top Produk</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => handleExport('daily', 'pdf')}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" /> PDF
            </button>
            <button
              onClick={() => handleExport('daily', 'excel')}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </div>

          {isLoadingDaily ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : dailyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <BarChart3 className="h-4 w-4" />
                    Total Penjualan
                  </div>
                  <p className="text-xl font-bold">{formatPrice(dailyReport.totalSales)}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Profit
                  </div>
                  <p className="text-xl font-bold text-success">{formatPrice(dailyReport.profit)}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    Transaksi
                  </div>
                  <p className="text-xl font-bold">{dailyReport.transactionsCount}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Items Terjual
                  </div>
                  <p className="text-xl font-bold">{dailyReport.itemsSold}</p>
                </Card>
              </div>

              {dailyReport.topProducts.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Top Produk Hari Ini</h3>
                  <ul className="space-y-2">
                    {dailyReport.topProducts.map((product) => (
                      <li key={product.productId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{product.productName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{product.quantity} unit</span>
                          <span className="font-medium">{formatPrice(product.revenue)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Minggu:</label>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {isLoadingWeekly ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : weeklyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Penjualan</div>
                  <p className="text-xl font-bold">{formatPrice(weeklyReport.totalSales)}</p>
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Profit</div>
                  <p className="text-xl font-bold text-success">{formatPrice(weeklyReport.totalProfit)}</p>
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Transaksi</div>
                  <p className="text-xl font-bold">{weeklyReport.totalTransactions}</p>
                </Card>
              </div>

              {weeklyReport.dailyBreakdown.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Breakdown Harian</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left">Tanggal</th>
                          <th className="px-4 py-2 text-right">Penjualan</th>
                          <th className="px-4 py-2 text-right">Profit</th>
                          <th className="px-4 py-2 text-right">Transaksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {weeklyReport.dailyBreakdown.map((day) => (
                          <tr key={day.date}>
                            <td className="px-4 py-2">{format(new Date(day.date), 'EEE, dd MMM', { locale: id })}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(day.totalSales)}</td>
                            <td className="px-4 py-2 text-right text-success">{formatPrice(day.profit)}</td>
                            <td className="px-4 py-2 text-right">{day.transactionsCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Bulan:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => handleExport('monthly', 'pdf')}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" /> PDF
            </button>
            <button
              onClick={() => handleExport('monthly', 'excel')}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </div>

          {isLoadingMonthly ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : monthlyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Penjualan</div>
                  <p className="text-xl font-bold">{formatPrice(monthlyReport.totalSales)}</p>
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Profit</div>
                  <p className="text-xl font-bold text-success">{formatPrice(monthlyReport.totalProfit)}</p>
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm mb-1">Total Transaksi</div>
                  <p className="text-xl font-bold">{monthlyReport.totalTransactions}</p>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="top-products" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Periode:</span>
            {([1, 7, 30] as (1|7|30)[]).map(p => (
              <button
                key={p}
                onClick={() => setTopPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  topPeriod === p
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p === 1 ? 'Hari Ini' : `${p} Hari`}
              </button>
            ))}
          </div>

          {isLoadingTop ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : topProducts ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-gray-800">Top Produk</h3>
                </div>
                {topProducts.top.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada data</p>
                ) : (
                  <ul className="space-y-3">
                    {topProducts.top.map((product, index) => (
                      <li key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? 'warning' : 'default'}>{index + 1}</Badge>
                          <span className="text-sm font-medium">{product.productName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(product.revenue)}</p>
                          <p className="text-xs text-gray-500">{product.quantity} unit</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                  <h3 className="font-semibold text-gray-800">Bottom Produk</h3>
                </div>
                {topProducts.bottom.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada data</p>
                ) : (
                  <ul className="space-y-3">
                    {topProducts.bottom.map((product, index) => (
                      <li key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{index + 1}</Badge>
                          <span className="text-sm font-medium">{product.productName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(product.revenue)}</p>
                          <p className="text-xs text-gray-500">{product.quantity} unit</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
