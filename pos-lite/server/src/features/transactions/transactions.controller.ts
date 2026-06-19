import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as transactionsService from './transactions.service.js'

export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, limit } = req.query
    const transactions = await transactionsService.getTransactions(
      req.ownerId!,
      startDate as string | undefined,
      endDate as string | undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    )
    res.json({ success: true, data: transactions })
  } catch (err) {
    next(err)
  }
}

export async function getTransactionById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionsService.getTransactionById(req.ownerId!, req.params.id)
    res.json({ success: true, data: transaction })
  } catch (err) {
    next(err)
  }
}

export async function createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionsService.createTransaction(req.ownerId!, req.body)
    res.status(201).json({ success: true, data: transaction })
  } catch (err) {
    next(err)
  }
}

export async function voidTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionsService.voidTransaction(req.ownerId!, req.params.id)
    res.json({ success: true, data: transaction })
  } catch (err) {
    next(err)
  }
}
