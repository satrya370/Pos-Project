import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as reportsService from './reports.service.js'

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
