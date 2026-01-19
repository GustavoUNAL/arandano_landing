import { Product } from './products'
import { Sale, getSales as getSalesDB, getSalesByDateRange as getSalesByDateRangeDB } from './db-sales'
import { Expense, getExpenses as getExpensesDB, getExpensesByDateRange as getExpensesByDateRangeDB } from './db-expenses'

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

// Función para obtener todos los días de una semana
export function getWeekDays(weekNumber: number, year: number): Date[] {
  const weekRange = getWeekRange(weekNumber, year)
  const days: Date[] = []
  const current = new Date(weekRange.start)
  
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
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

export interface DailyKPIs {
  date: string // Fecha en formato YYYY-MM-DD
  dayName: string // Nombre del día (Lunes, Martes, etc.)
  totalRevenue: number
  totalSales: number
  averageTicket: number
  nequi: number
  efectivo: number
  daySales: number // Ventas en horario diurno (6am-6pm)
  nightSales: number // Ventas en horario nocturno (6pm-6am)
  totalExpenses: number // Gastos/compras del día
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
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
  dailyKPIs: DailyKPIs[] // Análisis detallado por día
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
    if (!item) return sum
    // PRIORIDAD: Usar totalPrice si existe (precio real vendido)
    // Luego unitPrice * quantity (precio unitario * cantidad)
    // Finalmente price * quantity (formato legacy)
    // IMPORTANTE: Usar siempre los precios de la venta, NO los precios actuales del producto
    const itemTotal = (item as any).totalPrice || 
                     ((item as any).unitPrice || 0) * (item.quantity || 0) ||
                     ((item as any).price || 0) * (item.quantity || 0)
    return sum + itemTotal
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

export async function calculateKPIs(
  products: Product[],
  startDate: string,
  endDate: string
): Promise<KPIs> {
  // Usar funciones optimizadas que filtran en la base de datos
  const sales = await getSalesByDateRangeDB(startDate, endDate)
  const expenses = await getExpensesByDateRangeDB(startDate, endDate)
  
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

// Calcular KPIs diarios para una fecha específica
export async function calculateDailyKPIs(
  products: Product[],
  date: string
): Promise<DailyKPIs> {
  // Optimizar: obtener solo ventas y gastos del día desde la BD
  const daySales = await getSalesByDateRangeDB(date, date)
  const dayExpenses = await getExpensesByDateRangeDB(date, date)
  
  const totalRevenue = daySales.reduce((sum, s) => sum + s.total, 0)
  const totalSales = daySales.length
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
  
  // Gastos/compras del día
  const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Métodos de pago
  const nequi = daySales
    .filter(s => s.paymentMethod === 'nequi')
    .reduce((sum, s) => sum + s.total, 0)
  
  const efectivo = daySales
    .filter(s => s.paymentMethod === 'efectivo')
    .reduce((sum, s) => sum + s.total, 0)
  
  // Ventas por horario
  const daySalesAmount = daySales.filter(s => s.hour >= 6 && s.hour < 18)
    .reduce((sum, s) => sum + s.total, 0)
  
  const nightSalesAmount = daySales.filter(s => s.hour >= 18 || s.hour < 6)
    .reduce((sum, s) => sum + s.total, 0)
  
  // Top productos del día
  const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>()
  
  daySales.forEach(sale => {
    sale.items.forEach(item => {
      const itemTotal = (item as any).totalPrice || 
                      ((item as any).unitPrice || 0) * (item.quantity || 0) ||
                      ((item as any).price || 0) * (item.quantity || 0)
      
      if (productMap.has(item.productId)) {
        const existing = productMap.get(item.productId)!
        existing.quantity += item.quantity || 0
        existing.revenue += itemTotal
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity || 0,
          revenue: itemTotal
        })
      }
    })
  })
  
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) // Top 5 productos
  
  // Nombre del día
  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('es-CO', { weekday: 'long' })
  
  return {
    date,
    dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
    totalRevenue,
    totalSales,
    averageTicket,
    nequi,
    efectivo,
    daySales: daySalesAmount,
    nightSales: nightSalesAmount,
    totalExpenses,
    topProducts
  }
}

// Calcular KPIs agrupados por semana
export async function calculateWeeklyKPIs(
  products: Product[],
  year: number
): Promise<WeeklyKPIs[]> {
  // Optimizar: obtener solo ventas y gastos del año desde la BD
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  const sales = await getSalesByDateRangeDB(startDate, endDate)
  const expenses = await getExpensesByDateRangeDB(startDate, endDate)
  
  // Obtener todas las semanas del año que tienen datos
  const weeksWithData = new Set<number>()
  
  sales.forEach(sale => {
    const saleDate = new Date(sale.date)
    weeksWithData.add(getWeekOfYear(saleDate))
  })
  
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date)
    weeksWithData.add(getWeekOfYear(expenseDate))
  })
  
  const weeklyKPIs: WeeklyKPIs[] = []
  
  // Convertir Set a Array para poder iterar con for...of
  const weeksArray = Array.from(weeksWithData)
  
  // Usar for...of en lugar de forEach para poder usar await
  for (const weekNumber of weeksArray) {
    const weekRange = getWeekRange(weekNumber, year)
    const startDate = weekRange.start.toISOString().split('T')[0]
    const endDate = weekRange.end.toISOString().split('T')[0]
    
    const kpis = await calculateKPIs(products, startDate, endDate)
    
    // Calcular KPIs diarios para cada día de la semana
    const weekDays = getWeekDays(weekNumber, year)
    const dailyKPIs: DailyKPIs[] = []
    
    for (const day of weekDays) {
      const dayStr = day.toISOString().split('T')[0]
      const dailyKpi = await calculateDailyKPIs(products, dayStr)
      dailyKPIs.push(dailyKpi)
    }
    
    weeklyKPIs.push({
      ...kpis,
      weekNumber,
      year,
      startDate,
      endDate,
      dailyKPIs
    })
  }
  
  return weeklyKPIs.sort((a, b) => a.weekNumber - b.weekNumber)
}

// Calcular KPIs agrupados por mes (cuando hay 4 semanas completas)
export async function calculateMonthlyKPIs(
  products: Product[],
  year: number
): Promise<MonthlyKPIs[]> {
  const weeklyKPIs = await calculateWeeklyKPIs(products, year)
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
  // Convertir Map.entries() a Array para poder iterar con for...of
  const monthEntries = Array.from(monthGroups.entries())
  
  // Usar for...of en lugar de forEach para poder usar await
  for (const [month, weeks] of monthEntries) {
    if (weeks.length >= 4) {
      // Calcular el rango de fechas del mes
      const firstWeek = weeks[0]
      const lastWeek = weeks[weeks.length - 1]
      const startDate = firstWeek.startDate
      const endDate = lastWeek.endDate
      
      // Calcular KPIs agregados del mes
      const monthlyKpis = await calculateKPIs(products, startDate, endDate)
      
      monthlyKPIs.push({
        ...monthlyKpis,
        month,
        year,
        startDate,
        endDate,
        weeks: weeks.map(w => w.weekNumber)
      })
    }
  }
  
  return monthlyKPIs.sort((a, b) => a.month - b.month)
}
