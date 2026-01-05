import { Product } from './products'
import { Sale, getSales, getSalesByProduct } from './sales'
import { Expense, getExpenses, getMonthlyFixedExpenses } from './expenses'

// Función para obtener el número de semana del año (ISO 8601)
export function getWeekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Función para obtener el primer día de la semana
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para lunes como primer día
  return new Date(d.setDate(diff))
}

// Función para obtener el último día de la semana
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return weekEnd
}

// Función para obtener el rango de fechas de una semana
export function getWeekRange(weekNumber: number, year: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - jan4Day + 1)
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return { start: weekStart, end: weekEnd }
}

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
  fixedExpenses: number
  variableExpenses: number
  grossMargin: number
  netMargin: number
  breakEvenPoint: number // Pedidos necesarios para punto de equilibrio
  
  // Productos
  starProducts: number
  volumeProducts: number
  premiumProducts: number
  problemProducts: number
}

export interface WeeklyKPIs extends KPIs {
  weekNumber: number
  year: number
  startDate: string
  endDate: string
}

export interface MonthlyKPIs extends KPIs {
  month: number
  year: number
  startDate: string
  endDate: string
  weeks: number[]
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
  // Gastos fijos desde expenses
  const fixedExpenses = expenses
    .filter(e => e.type === 'fixed')
    .reduce((sum, e) => sum + e.amount, 0)
  
  // Gastos variables calculados desde inventario (productos vendidos × costo)
  const variableExpenses = products.reduce((sum, p) => {
    const productSales = sales.filter(s =>
      s.items.some(item => item.productId === p.id)
    )
    const sold = productSales.reduce((s, sale) => {
      const item = sale.items.find(i => i.productId === p.id)
      return s + (item?.quantity || 0)
    }, 0)
    return sum + (sold * (p.cost || 0))
  }, 0)
  
  const totalCosts = fixedExpenses + variableExpenses
  const productCosts = variableExpenses // Los costos de productos son los gastos variables
  const grossMargin = totalRevenue - productCosts
  const netMargin = grossMargin - totalCosts
  
  // Punto de equilibrio
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
    fixedExpenses,
    variableExpenses,
    grossMargin,
    netMargin,
    breakEvenPoint,
    starProducts,
    volumeProducts,
    premiumProducts,
    problemProducts
  }
}

// Calcular KPIs agrupados por semana
export function calculateWeeklyKPIs(
  products: Product[],
  year: number
): WeeklyKPIs[] {
  const sales = getSales()
  const expenses = getExpenses()
  
  // Obtener todas las semanas del año que tienen datos
  const weeksWithData = new Set<number>()
  
  sales.forEach(sale => {
    const saleDate = new Date(sale.date)
    if (saleDate.getFullYear() === year) {
      weeksWithData.add(getWeekOfYear(saleDate))
    }
  })
  
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date)
    if (expenseDate.getFullYear() === year) {
      weeksWithData.add(getWeekOfYear(expenseDate))
    }
  })
  
  const weeklyKPIs: WeeklyKPIs[] = []
  
  weeksWithData.forEach(weekNumber => {
    const weekRange = getWeekRange(weekNumber, year)
    const startDate = weekRange.start.toISOString().split('T')[0]
    const endDate = weekRange.end.toISOString().split('T')[0]
    
    const kpis = calculateKPIs(products, startDate, endDate)
    
    weeklyKPIs.push({
      ...kpis,
      weekNumber,
      year,
      startDate,
      endDate
    })
  })
  
  return weeklyKPIs.sort((a, b) => a.weekNumber - b.weekNumber)
}

// Calcular KPIs agrupados por mes (cuando hay 4 semanas completas)
export function calculateMonthlyKPIs(
  products: Product[],
  year: number
): MonthlyKPIs[] {
  const weeklyKPIs = calculateWeeklyKPIs(products, year)
  const monthlyKPIs: MonthlyKPIs[] = []
  
  // Agrupar semanas por mes
  const monthGroups = new Map<number, WeeklyKPIs[]>()
  
  weeklyKPIs.forEach(week => {
    const weekStart = new Date(week.startDate)
    const month = weekStart.getMonth()
    
    if (!monthGroups.has(month)) {
      monthGroups.set(month, [])
    }
    monthGroups.get(month)!.push(week)
  })
  
  // Crear KPIs mensuales solo si hay 4 semanas completas
  monthGroups.forEach((weeks, month) => {
    if (weeks.length >= 4) {
      // Calcular el rango de fechas del mes
      const firstWeek = weeks[0]
      const lastWeek = weeks[weeks.length - 1]
      const startDate = firstWeek.startDate
      const endDate = lastWeek.endDate
      
      // Calcular KPIs agregados del mes
      const monthlyKpis = calculateKPIs(products, startDate, endDate)
      
      monthlyKPIs.push({
        ...monthlyKpis,
        month,
        year,
        startDate,
        endDate,
        weeks: weeks.map(w => w.weekNumber)
      })
    }
  })
  
  return monthlyKPIs.sort((a, b) => a.month - b.month)
}

