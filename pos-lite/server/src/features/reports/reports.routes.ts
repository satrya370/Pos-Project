import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.js'
import * as reportsController from './reports.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/profit-margin', reportsController.getProfitMargin)
router.get('/comparison', reportsController.getPeriodComparison)
router.get('/analytics', reportsController.getAnalytics)
router.get('/export', reportsController.exportReport)
router.get('/daily', reportsController.getDailyReport)
router.get('/weekly', reportsController.getWeeklyReport)
router.get('/monthly', reportsController.getMonthlyReport)
router.get('/top-products', reportsController.getTopProducts)

export default router
