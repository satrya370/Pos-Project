import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { authMiddleware } from '../../middlewares/auth.js'
import { loginSchema } from './auth.types.js'
import * as authController from './auth.controller.js'

const router = Router()

router.post('/login', validate(loginSchema), authController.login)
router.get('/me', authMiddleware, authController.getMe)
router.post('/logout', authMiddleware, authController.logout)

export default router
