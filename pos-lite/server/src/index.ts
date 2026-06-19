import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import { AppError } from './lib/errors.js'
import authRoutes from './features/auth/auth.routes.js'
import productsRoutes from './features/products/products.routes.js'
import transactionsRoutes from './features/transactions/transactions.routes.js'
import reportsRoutes from './features/reports/reports.routes.js'
import suppliersRoutes from './features/suppliers/suppliers.routes.js'
import categoriesRoutes from './features/categories/categories.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(helmet())
app.use(morgan('dev'))
app.use(compression())
app.use(express.json())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/suppliers', suppliersRoutes)
app.use('/api/categories', categoriesRoutes)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message })
    return
  }

  console.error('[UNEXPECTED ERROR]', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
