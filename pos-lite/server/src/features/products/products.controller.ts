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

export async function uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File tidak ditemukan' })
    }
    const product = await productsService.uploadProductImage(req.ownerId!, req.params.id, req.file)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export async function deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await productsService.deleteProductImage(req.ownerId!, req.params.id)
    res.json({ success: true, data: { message: 'Gambar berhasil dihapus' } })
  } catch (err) {
    next(err)
  }
}

// Size endpoints
export async function getSizes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sizes = await productsService.getSizes(req.ownerId!, req.params.id)
    res.json({ success: true, data: sizes })
  } catch (err) {
    next(err)
  }
}

export async function createSize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const size = await productsService.createSize(req.ownerId!, req.params.id, req.body)
    res.status(201).json({ success: true, data: size })
  } catch (err) {
    next(err)
  }
}

export async function updateSize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const size = await productsService.updateSize(req.ownerId!, req.params.id, req.params.sizeId, req.body)
    res.json({ success: true, data: size })
  } catch (err) {
    next(err)
  }
}

export async function deleteSize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await productsService.deleteSize(req.ownerId!, req.params.id, req.params.sizeId)
    res.json({ success: true, data: { message: 'Ukuran berhasil dihapus' } })
  } catch (err) {
    next(err)
  }
}

export async function restockSize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const size = await productsService.restockSize(req.ownerId!, req.params.id, req.params.sizeId, req.body)
    res.json({ success: true, data: size })
  } catch (err) {
    next(err)
  }
}

export async function getRestockHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const history = await productsService.getRestockHistory(req.ownerId!, req.params.id)
    res.json({ success: true, data: history })
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

export async function getStockSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await productsService.getStockSummary(req.ownerId!)
    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
}

export async function getExpiring(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const withinDays = req.query.withinDays ? Number(req.query.withinDays) : 30
    const products = await productsService.getExpiringProducts(req.ownerId!, withinDays)
    res.json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}

export async function addVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await productsService.addVariant(req.ownerId!, req.params.id, req.body.variantName)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const variantName = decodeURIComponent(req.params.variantName)
    const result = await productsService.deleteVariant(req.ownerId!, req.params.id, variantName)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function addSizeName(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await productsService.addSizeName(req.ownerId!, req.params.id, req.body.sizeName)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteSizeName(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sizeName = decodeURIComponent(req.params.sizeName)
    const result = await productsService.deleteSizeName(req.ownerId!, req.params.id, sizeName)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
