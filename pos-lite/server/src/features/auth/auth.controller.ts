import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as authService from './auth.service.js'

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const owner = await authService.getMe(req.ownerId!)
    res.json({ success: true, data: owner })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: AuthRequest, res: Response) {
  res.json({ success: true, data: { message: 'Logout berhasil' } })
}
