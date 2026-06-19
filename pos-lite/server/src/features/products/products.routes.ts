import { Router } from 'express'
import multer from 'multer'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { createProductSchema, updateProductSchema, createSizeSchema, updateSizeSchema, restockSizeSchema } from './products.types.js'
import { uploadConfig } from '../../config/upload.js'
import * as productsController from './products.controller.js'

const router = Router()

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadConfig.uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${req.params.id}-${Date.now()}.${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: uploadConfig.maxSize },
  fileFilter: (req, file, cb) => {
    if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipe file tidak diizinkan'))
    }
  },
})

router.use(authMiddleware)

// Image upload
router.post('/:id/image', upload.single('image'), productsController.uploadImage)
router.delete('/:id/image', productsController.deleteImage)

// Size routes
router.get('/:id/sizes', productsController.getSizes)
router.post('/:id/sizes', validate(createSizeSchema), productsController.createSize)
router.put('/:id/sizes/:sizeId', validate(updateSizeSchema), productsController.updateSize)
router.delete('/:id/sizes/:sizeId', productsController.deleteSize)
router.post('/:id/sizes/:sizeId/restock', validate(restockSizeSchema), productsController.restockSize)

// Static routes — must be BEFORE /:id to avoid conflict
router.get('/low-stock', productsController.getLowStockProducts)
router.get('/stock-summary', productsController.getStockSummary)
router.get('/:id/restock-history', productsController.getRestockHistory)

// Product routes
router.get('/', productsController.getProducts)
router.get('/:id', productsController.getProductById)
router.post('/', validate(createProductSchema), productsController.createProduct)
router.put('/:id', validate(updateProductSchema), productsController.updateProduct)
router.delete('/:id', productsController.deleteProduct)

export default router
