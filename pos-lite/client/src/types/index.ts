export interface Owner {
  id: string
  name: string
  email: string
  phone?: string | null
  waNumber?: string | null
  telegramChatId?: string | null
  dailyTarget?: number | null
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
  ownerId?: string
  name: string
  icon?: string | null
  createdAt?: string
}

export interface Supplier {
  id: string
  ownerId: string
  name: string
  contact?: string | null
  phone?: string | null
  address?: string | null
  createdAt: string
}

export interface Customer {
  id: string
  ownerId: string
  name: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  type: string
  quantity: number
  referenceId?: string | null
  notes?: string | null
  purchasePrice?: number | null
  invoiceNumber?: string | null
  supplierId?: string | null
  createdAt: string
}

export interface DebtPayment {
  id: string
  transactionId: string
  amount: number
  notes?: string | null
  paidAt: string
  createdAt: string
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
  discountPercent: number
  discountAmount: number
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
  paymentStatus: string
  customerId?: string | null
  customerName?: string | null
  createdAt: string
  items: TransactionItem[]
  debtPayments?: DebtPayment[]
}

export interface CreateTransactionInput {
  items: { productId: string; productSizeId: string; quantity: number; discountPercent?: number }[]
  notes?: string | null
  customerId?: string | null
  customerName?: string | null
  paymentStatus?: 'paid' | 'credit'
}

export interface CartItem {
  id: string
  productId: string
  productSizeId: string
  productName: string
  size: string
  price: number
  quantity: number
  discountPercent: number
  imageUrl?: string | null
}

export interface ProductRank {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface Comparison {
  amount: number
  percent: number
}

export interface DailyReport {
  date: string
  totalSales: number
  totalCost: number
  profit: number
  transactionsCount: number
  itemsSold: number
  topProducts: ProductRank[]
  comparison: {
    sales: Comparison
    profit: Comparison
    transactions: Comparison
  }
}

export interface StockSummary {
  totalStockValue: number
  outOfStockCount: number
  lowStockCount: number
  deadStockProducts: { id: string; name: string; sizes: { id: string; name: string; stock: number }[] }[]
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
