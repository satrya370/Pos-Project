export interface Owner {
  id: string
  name: string
  email: string
  phone?: string | null
  waNumber?: string | null
  telegramChatId?: string | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  owner: Owner
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface ApiError {
  success: false
  error: string
  statusCode: number
}

export interface Category {
  id: string
  name: string
  icon?: string | null
}

export interface ProductSize {
  id: string
  productId: string
  name: string
  stock: number
  sku?: string | null
}

export interface Product {
  id: string
  ownerId: string
  categoryId?: string | null
  supplierId?: string | null
  sku?: string | null
  name: string
  description?: string | null
  purchasePrice: number
  sellingPrice: number
  imageUrl?: string | null
  minStockThreshold: number
  isBundle: boolean
  bundleProducts?: string | null
  createdAt: string
  updatedAt: string
  category?: Category | null
  sizes: ProductSize[]
}

export interface CreateProductInput {
  name: string
  categoryId?: string | null
  supplierId?: string | null
  sku?: string | null
  description?: string | null
  purchasePrice?: number
  sellingPrice: number
  minStockThreshold?: number
  isBundle?: boolean
  bundleProducts?: string | null
  sizes?: { name: string; stock: number; sku?: string | null }[]
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface CreateSizeInput {
  name: string
  stock?: number
  sku?: string | null
}

export interface TransactionItem {
  id: string
  transactionId: string
  productId?: string | null
  productSizeId?: string | null
  productName: string
  size?: string | null
  quantity: number
  unitPrice: number
  costAtPurchase: number
  subtotal: number
}

export interface Transaction {
  id: string
  ownerId: string
  invoiceNumber: string
  totalAmount: number
  totalCost: number
  profit: number
  itemsCount: number
  notes?: string | null
  status: string
  createdAt: string
  items: TransactionItem[]
}

export interface CreateTransactionInput {
  items: { productId: string; productSizeId: string; quantity: number }[]
  notes?: string | null
}

export interface CartItem {
  id: string
  productId: string
  productSizeId: string
  productName: string
  size: string
  price: number
  quantity: number
  imageUrl?: string | null
}

export interface ProductRank {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface DailyReport {
  date: string
  totalSales: number
  totalCost: number
  profit: number
  transactionsCount: number
  itemsSold: number
  topProducts: ProductRank[]
}

export interface DailyBreakdown {
  date: string
  totalSales: number
  profit: number
  transactionsCount: number
}

export interface WeeklyReport {
  week: string
  dailyBreakdown: DailyBreakdown[]
  totalSales: number
  totalProfit: number
  totalTransactions: number
}

export interface MonthlyReport {
  month: string
  weeklyBreakdown: WeeklyReport[]
  totalSales: number
  totalProfit: number
  totalTransactions: number
}

export interface TopProductsReport {
  period: string
  top: ProductRank[]
  bottom: ProductRank[]
}
