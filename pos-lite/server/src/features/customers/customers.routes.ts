import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createCustomerSchema, updateCustomerSchema } from './customers.types.js'
import * as customersController from './customers.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/',    customersController.getCustomers)
router.get('/:id', customersController.getCustomerById)
router.post('/',   validate(createCustomerSchema), customersController.createCustomer)
router.put('/:id', validate(updateCustomerSchema), customersController.updateCustomer)
router.delete('/:id', customersController.deleteCustomer)
export default router
