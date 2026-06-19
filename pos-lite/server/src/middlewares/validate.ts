import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { BadRequestError } from '../lib/errors.js'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ')
      return next(new BadRequestError(message))
    }

    req.body = result.data
    next()
  }
}
