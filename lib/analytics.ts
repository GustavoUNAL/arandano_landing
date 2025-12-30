import { Product } from './products'
import { Sale, getSales, getSalesByProduct } from './sales'
import { Expense, getExpenses, getMonthlyFixedExpenses } from './expenses'

export interface ProductAnalytics {
  product: Product
  totalSold: number
  totalRevenue: number
  totalCost: number
  grossMargin: number
  grossMarginPercent: number
  rotation: number // Rotación de inventario
  daysInStock: number // Días en inventario
  lastSaleDaysAgo: number // Días desde última venta
  classification: 'estrella' | 'volumen' | 'premium' | 'problema'
}

export interface KPIs {
  // Inventario
  totalInventoryValue: number
  lowStockProducts: number
  dormantProducts30: number
  dormantProducts60: number
  
  // Ventas
  totalRevenue: number
  averageTicket: number
  daySales: number
  nightSales: number
  revenuePerHour: number[]
  
  // Rentabilidad
  totalCosts: number
  grossMargin: number
  netMargin: number
  breakEvenPoint: number // Pedidos necesarios para punto de equilibrio
  
  // Productos
  starProducts: number
  volumeProducts: number
  premiumProducts: number
  problemProducts: number
}

export function calculateProductAnalytics(
  product: Product,
  sales: Sale[]
): ProductAnalytics {
  const productSales = sales.filter(sale =>
    sale.items.some(item => item.productId === product.id)
  )
  
  const totalSold = productSales.reduce((sum, sale) => {
    const item = sale.items.find(i => i.productId === product.id)
    return sum + (item?.quantity || 0)
  }, 0)
  
  const totalRevenue = productSales.reduce((sum, sale) => {
    const item = sale.items.find(i => i.productId === product.id)
    return sum + (item?.totalPrice || 0)
  }, 0)
  
  const cost = product.cost || 0
  const totalCost = totalSold * cost
  const grossMargin = totalRevenue - totalCost
  const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0
  
  // Rotación de inventario (ventas / stock promedio)
  const rotation = product.stock > 0 ? totalSold / product.stock : 0
  
  // Días en inventario
  const purchaseDate = product.purchaseDate ? new Date(product.purchaseDate) : new Date()
  const daysInStock = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Días desde última venta
  const lastSale = productSales.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]
  const lastSaleDaysAgo = lastSale 
    ? Math.floor((Date.now() - new Date(lastSale.date).getTime()) / (1000 * 60 * 60 * 24))
    : daysInStock
  
  // Clasificación
  const highRotation = rotation > 0.5
  const highMargin = grossMarginPercent > 30
  let classification: 'estrella' | 'volumen' | 'premium' | 'problema'
  
  if (highRotation && highMargin) {
    classification = 'estrella'
  } else if (highRotation && !highMargin) {
    classification = 'volumen'
  } else if (!highRotation && highMargin) {
    classification = 'premium'
  } else {
    classification = 'problema'
  }
  
  return {
    product,
    totalSold,
    totalRevenue,
    totalCost,
    grossMargin,
    grossMarginPercent,
    rotation,
    daysInStock,
    lastSaleDaysAgo,
    classification
  }
}

export function calculateKPIs(
  products: Product[],
  startDate: string,
  endDate: string
): KPIs {
  const sales = getSales().filter(sale => {
    const saleDate = new Date(sale.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return saleDate >= start && saleDate <= end
  })
  
  const expenses = getExpenses().filter(expense => {
    const expenseDate = new Date(expense.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return expenseDate >= start && expenseDate <= end
  })
  
  // Inventario
  const totalInventoryValue = products.reduce((sum, p) => 
    sum + (p.stock * (p.cost || 0)), 0
  )
  
  const lowStockProducts = products.filter(p => 
    (p.minStock || 0) > 0 && p.stock <= (p.minStock || 0)
  ).length
  
  const dormantProducts30 = products.filter(p => {
    const lastSaleDaysAgo = p.lastSaleDate 
      ? Math.floor((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    return lastSaleDaysAgo > 30
  }).length
  
  const dormantProducts60 = products.filter(p => {
    const lastSaleDaysAgo = p.lastSaleDate 
      ? Math.floor((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    return lastSaleDaysAgo > 60
  }).length
  
  // Ventas
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0
  
  const daySales = sales.filter(s => s.hour >= 6 && s.hour < 18)
    .reduce((sum, s) => sum + s.total, 0)
  
  const nightSales = sales.filter(s => s.hour >= 18 || s.hour < 6)
    .reduce((sum, s) => sum + s.total, 0)
  
  // Ingreso por hora
  const revenuePerHour = Array(24).fill(0)
  sales.forEach(sale => {
    revenuePerHour[sale.hour] += sale.total
  })
  
  // Rentabilidad
  const totalCosts = expenses.reduce((sum, e) => sum + e.amount, 0)
  const productCosts = products.reduce((sum, p) => {
    const productSales = sales.filter(s =>
      s.items.some(item => item.productId === p.id)
    )
    const sold = productSales.reduce((s, sale) => {
      const item = sale.items.find(i => i.productId === p.id)
      return s + (item?.quantity || 0)
    }, 0)
    return sum + (sold * (p.cost || 0))
  }, 0)
  
  const grossMargin = totalRevenue - productCosts
  const netMargin = grossMargin - totalCosts
  
  // Punto de equilibrio
  const fixedExpenses = expenses
    .filter(e => e.type === 'fixed')
    .reduce((sum, e) => sum + e.amount, 0)
  const avgOrderValue = averageTicket
  const breakEvenPoint = avgOrderValue > 0 ? Math.ceil(fixedExpenses / avgOrderValue) : 0
  
  // Clasificación de productos
  const productAnalytics = products.map(p => calculateProductAnalytics(p, sales))
  const starProducts = productAnalytics.filter(a => a.classification === 'estrella').length
  const volumeProducts = productAnalytics.filter(a => a.classification === 'volumen').length
  const premiumProducts = productAnalytics.filter(a => a.classification === 'premium').length
  const problemProducts = productAnalytics.filter(a => a.classification === 'problema').length
  
  return {
    totalInventoryValue,
    lowStockProducts,
    dormantProducts30,
    dormantProducts60,
    totalRevenue,
    averageTicket,
    daySales,
    nightSales,
    revenuePerHour,
    totalCosts,
    grossMargin,
    netMargin,
    breakEvenPoint,
    starProducts,
    volumeProducts,
    premiumProducts,
    problemProducts
  }
}

