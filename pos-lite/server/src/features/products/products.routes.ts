import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createProductSchema, updateProductSchema, restockSchema } from './products.types.js'
import * as productsController from './products.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/low-stock', productsController.getLowStockProducts)
router.get('/', productsController.getProducts)
router.get('/:id', productsController.getProductById)
router.post('/', validate(createProductSchema), productsController.createProduct)
router.put('/:id', validate(updateProductSchema), productsController.updateProduct)
router.delete('/:id', productsController.deleteProduct)
router.post('/:id/restock', validate(restockSchema), productsController.restock)

export default router
