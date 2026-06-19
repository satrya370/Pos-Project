import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createTransactionSchema, recordPaymentSchema } from './transactions.types.js'
import * as transactionsController from './transactions.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/debts', transactionsController.getDebts)
router.get('/', transactionsController.getTransactions)
router.get('/:id', transactionsController.getTransactionById)
router.post('/', validate(createTransactionSchema), transactionsController.createTransaction)
router.put('/:id/void', transactionsController.voidTransaction)
router.post('/:id/pay', validate(recordPaymentSchema), transactionsController.recordDebtPayment)

export default router
