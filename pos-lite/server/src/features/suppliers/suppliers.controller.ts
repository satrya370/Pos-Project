import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as suppliersService from './suppliers.service.js'

export async function getSuppliers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await suppliersService.getSuppliers(req.ownerId!)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function getSupplierById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await suppliersService.getSupplierById(req.ownerId!, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function createSupplier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await suppliersService.createSupplier(req.ownerId!, req.body)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function updateSupplier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await suppliersService.updateSupplier(req.ownerId!, req.params.id, req.body)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteSupplier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await suppliersService.deleteSupplier(req.ownerId!, req.params.id)
    res.json({ success: true, data: { message: 'Supplier berhasil dihapus' } })
  } catch (err) {
    next(err)
  }
}
