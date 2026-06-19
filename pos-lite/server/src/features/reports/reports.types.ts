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
