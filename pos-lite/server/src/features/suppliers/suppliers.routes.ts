import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createSupplierSchema, updateSupplierSchema } from './suppliers.types.js'
import * as suppliersController from './suppliers.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/',       suppliersController.getSuppliers)
router.get('/:id',    suppliersController.getSupplierById)
router.post('/',      validate(createSupplierSchema), suppliersController.createSupplier)
router.put('/:id',    validate(updateSupplierSchema), suppliersController.updateSupplier)
router.delete('/:id', suppliersController.deleteSupplier)
export default router
