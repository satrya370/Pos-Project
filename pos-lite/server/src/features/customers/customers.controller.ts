import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/auth.js'
import * as customersService from './customers.service.js'

export async function getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query
    const customers = await customersService.getCustomers(req.ownerId!, search as string | undefined)
    res.json({ success: true, data: customers })
  } catch (err) { next(err) }
}

export async function getCustomerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.getCustomerById(req.ownerId!, req.params.id)
    res.json({ success: true, data: customer })
  } catch (err) { next(err) }
}

export async function createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.createCustomer(req.ownerId!, req.body)
    res.status(201).json({ success: true, data: customer })
  } catch (err) { next(err) }
}

export async function updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.updateCustomer(req.ownerId!, req.params.id, req.body)
    res.json({ success: true, data: customer })
  } catch (err) { next(err) }
}

export async function deleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await customersService.deleteCustomer(req.ownerId!, req.params.id)
    res.json({ success: true, data: { message: 'Customer berhasil dihapus' } })
  } catch (err) { next(err) }
}
