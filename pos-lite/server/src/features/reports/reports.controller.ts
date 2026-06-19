import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as reportsService from './reports.service.js'
import * as exportService from './reports.export.service.js'
import * as analyticsService from './reports.analytics.service.js'
import { BadRequestError } from '../../lib/errors.js'

export async function getDailyReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { date } = req.query
    const report = await reportsService.getDailyReport(req.ownerId!, date as string | undefined)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

export async function getWeeklyReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Accept 'date' param (YYYY-MM-DD) — any date within the target week
    const { date } = req.query
    const report = await reportsService.getWeeklyReport(req.ownerId!, date as string | undefined)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

export async function getMonthlyReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { month } = req.query
    const report = await reportsService.getMonthlyReport(req.ownerId!, month as string | undefined)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

export async function getTopProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { period } = req.query
    const report = await reportsService.getTopProducts(req.ownerId!, period as string | undefined)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

export async function exportReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, format, date, month } = req.query as Record<string, string>

    if (!['daily', 'monthly'].includes(type)) {
      return next(new BadRequestError('type harus daily atau monthly'))
    }
    if (!['pdf', 'excel'].includes(format)) {
      return next(new BadRequestError('format harus pdf atau excel'))
    }

    let buffer: Buffer
    let contentType: string
    let filename: string

    if (type === 'daily') {
      const report = await reportsService.getDailyReport(req.ownerId!, date)
      if (format === 'pdf') {
        buffer = await exportService.generateDailyPDF(report)
        contentType = 'application/pdf'
        filename = `laporan-harian-${report.date}.pdf`
      } else {
        buffer = await exportService.generateDailyExcel(report)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `laporan-harian-${report.date}.xlsx`
      }
    } else {
      const report = await reportsService.getMonthlyReport(req.ownerId!, month)
      if (format === 'pdf') {
        buffer = await exportService.generateMonthlyPDF(report)
        contentType = 'application/pdf'
        filename = `laporan-bulanan-${report.month}.pdf`
      } else {
        buffer = await exportService.generateMonthlyExcel(report)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `laporan-bulanan-${report.month}.xlsx`
      }
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (err) {
    next(err)
  }
}

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = parseInt(req.query.period as string) || 7
    const categoryId = req.query.categoryId as string | undefined
    const data = await analyticsService.getAnalytics(req.ownerId!, period, categoryId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export async function getProfitMargin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = parseInt(req.query.period as string) || 30
    const data = await analyticsService.getProfitMargin(req.ownerId!, period)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export async function getPeriodComparison(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = parseInt(req.query.period as string) || 7
    const data = await analyticsService.getPeriodComparison(req.ownerId!, period)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export async function getDeadStock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const threshold = parseInt(req.query.threshold as string) || 30
    const data = await analyticsService.getDeadStock(req.ownerId!, threshold)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export async function getPeakTime(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = parseInt(req.query.period as string) || 30
    const data = await analyticsService.getPeakTime(req.ownerId!, period)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
