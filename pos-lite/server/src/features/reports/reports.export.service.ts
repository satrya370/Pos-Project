import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { DailyReport, MonthlyReport } from './reports.types.js'

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

async function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

export async function generateDailyPDF(report: DailyReport): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 })

  doc.fontSize(18).font('Helvetica-Bold').text('Laporan Harian PosLite', { align: 'center' })
  doc.fontSize(12).font('Helvetica').text(`Tanggal: ${report.date}`, { align: 'center' })
  doc.moveDown(1.5)

  // Summary table
  const rows = [
    ['Total Penjualan', formatRp(report.totalSales)],
    ['Total Profit',    formatRp(report.profit)],
    ['Jumlah Transaksi', `${report.transactionsCount} transaksi`],
    ['Items Terjual',   `${report.itemsSold} item`],
  ]
  doc.fontSize(14).font('Helvetica-Bold').text('Ringkasan', { underline: true })
  doc.moveDown(0.5)
  for (const [label, value] of rows) {
    doc.fontSize(11).font('Helvetica-Bold').text(label + ':', { continued: true, width: 200 })
    doc.font('Helvetica').text(' ' + value)
  }

  if (report.topProducts.length > 0) {
    doc.moveDown(1)
    doc.fontSize(14).font('Helvetica-Bold').text('Top Produk', { underline: true })
    doc.moveDown(0.5)
    report.topProducts.forEach((p, i) => {
      doc.fontSize(10).font('Helvetica').text(
        `${i + 1}. ${p.productName} — ${p.quantity} pcs — ${formatRp(p.revenue)}`
      )
    })
  }

  return pdfToBuffer(doc)
}

export async function generateDailyExcel(report: DailyReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PosLite'

  const ws1 = wb.addWorksheet('Ringkasan')
  ws1.columns = [
    { header: 'Metrik', key: 'label', width: 25 },
    { header: 'Nilai',  key: 'value', width: 20 },
  ]
  ws1.addRows([
    { label: 'Tanggal',           value: report.date },
    { label: 'Total Penjualan',   value: report.totalSales },
    { label: 'Total Profit',      value: report.profit },
    { label: 'Jumlah Transaksi',  value: report.transactionsCount },
    { label: 'Items Terjual',     value: report.itemsSold },
  ])

  if (report.topProducts.length > 0) {
    const ws2 = wb.addWorksheet('Top Produk')
    ws2.columns = [
      { header: 'Rank',    key: 'rank',     width: 8 },
      { header: 'Produk',  key: 'name',     width: 30 },
      { header: 'Qty',     key: 'quantity', width: 10 },
      { header: 'Revenue', key: 'revenue',  width: 18 },
    ]
    report.topProducts.forEach((p, i) => {
      ws2.addRow({ rank: i + 1, name: p.productName, quantity: p.quantity, revenue: p.revenue })
    })
  }

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
}

export async function generateMonthlyPDF(report: MonthlyReport): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 })

  doc.fontSize(18).font('Helvetica-Bold').text('Laporan Bulanan PosLite', { align: 'center' })
  doc.fontSize(12).font('Helvetica').text(`Bulan: ${report.month}`, { align: 'center' })
  doc.moveDown(1.5)

  const rows = [
    ['Total Penjualan', formatRp(report.totalSales)],
    ['Total Profit',    formatRp(report.totalProfit)],
    ['Jumlah Transaksi', `${report.totalTransactions} transaksi`],
  ]
  doc.fontSize(14).font('Helvetica-Bold').text('Ringkasan', { underline: true })
  doc.moveDown(0.5)
  for (const [label, value] of rows) {
    doc.fontSize(11).font('Helvetica-Bold').text(label + ':', { continued: true, width: 200 })
    doc.font('Helvetica').text(' ' + value)
  }

  if (report.weeklyBreakdown.length > 0) {
    doc.moveDown(1)
    doc.fontSize(14).font('Helvetica-Bold').text('Breakdown Mingguan', { underline: true })
    doc.moveDown(0.5)
    for (const w of report.weeklyBreakdown) {
      doc.fontSize(10).font('Helvetica').text(
        `${w.week}: Penjualan ${formatRp(w.totalSales)} | Profit ${formatRp(w.totalProfit)} | ${w.totalTransactions} transaksi`
      )
    }
  }

  return pdfToBuffer(doc)
}

export async function generateMonthlyExcel(report: MonthlyReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PosLite'

  const ws1 = wb.addWorksheet('Ringkasan')
  ws1.columns = [
    { header: 'Metrik', key: 'label', width: 25 },
    { header: 'Nilai',  key: 'value', width: 20 },
  ]
  ws1.addRows([
    { label: 'Bulan',             value: report.month },
    { label: 'Total Penjualan',   value: report.totalSales },
    { label: 'Total Profit',      value: report.totalProfit },
    { label: 'Jumlah Transaksi',  value: report.totalTransactions },
  ])

  if (report.weeklyBreakdown.length > 0) {
    const ws2 = wb.addWorksheet('Breakdown Mingguan')
    ws2.columns = [
      { header: 'Minggu',    key: 'week',         width: 15 },
      { header: 'Penjualan', key: 'totalSales',   width: 18 },
      { header: 'Profit',    key: 'totalProfit',  width: 18 },
      { header: 'Transaksi', key: 'totalTrans',   width: 12 },
    ]
    for (const w of report.weeklyBreakdown) {
      ws2.addRow({ week: w.week, totalSales: w.totalSales, totalProfit: w.totalProfit, totalTrans: w.totalTransactions })
    }
  }

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
}
