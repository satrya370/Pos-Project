import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createCategorySchema, updateCategorySchema } from './categories.types.js'
import * as categoriesController from './categories.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/',       categoriesController.getCategories)
router.get('/:id',    categoriesController.getCategoryById)
router.post('/',      validate(createCategorySchema), categoriesController.createCategory)
router.put('/:id',    validate(updateCategorySchema), categoriesController.updateCategory)
router.delete('/:id', categoriesController.deleteCategory)
export default router
