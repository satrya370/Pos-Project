import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as categoriesService from './categories.service.js'

export async function getCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.getCategories(req.ownerId!)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getCategoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.getCategoryById(req.ownerId!, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.createCategory(req.ownerId!, req.body)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.updateCategory(req.ownerId!, req.params.id, req.body)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await categoriesService.deleteCategory(req.ownerId!, req.params.id)
    res.json({ success: true, data: { message: 'Kategori berhasil dihapus' } })
  } catch (err) {
    next(err)
  }
}
