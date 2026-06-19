import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as productsService from './products.service.js'

export async function getProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const products = await productsService.getProducts(req.ownerId!)
    res.json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}

export async function getProductById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productsService.getProductById(req.ownerId!, req.params.id)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productsService.createProduct(req.ownerId!, req.body)
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productsService.updateProduct(req.ownerId!, req.params.id, req.body)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await productsService.deleteProduct(req.ownerId!, req.params.id)
    res.json({ success: true, data: { message: 'Produk berhasil dihapus' } })
  } catch (err) {
    next(err)
  }
}

export async function restock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productsService.restock(req.ownerId!, req.params.id, req.body)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export async function getLowStockProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const products = await productsService.getLowStockProducts(req.ownerId!)
    res.json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}
