import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createTransactionSchema } from './transactions.types.js'
import * as transactionsController from './transactions.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', transactionsController.getTransactions)
router.get('/:id', transactionsController.getTransactionById)
router.post('/', validate(createTransactionSchema), transactionsController.createTransaction)
router.put('/:id/void', transactionsController.voidTransaction)

export default router
