/**
 * Script para analizar todas las ventas y generar estadísticas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 ANÁLISIS DE VENTAS\n')
console.log('═'.repeat(80))

// Obtener todas las ventas
const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC').all()

if (sales.length === 0) {
  console.log('\n⚠️  No hay ventas registradas\n')
  db.close()
  process.exit(0)
}

// Estadísticas generales
const totalSales = sales.length
const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
const averageTicket = totalRevenue / totalSales

// Fechas
const dates = sales.map(s => new Date(s.date))
const firstSale = dates[dates.length - 1]
const lastSale = dates[0]

// Ventas por método de pago
const paymentMethods = {}
sales.forEach(sale => {
  const method = sale.paymentMethod || 'Sin pago'
  if (!paymentMethods[method]) {
    paymentMethods[method] = { count: 0, total: 0 }
  }
  paymentMethods[method].count++
  paymentMethods[method].total += sale.total || 0
})

// Ventas por día de la semana
const salesByDay = {
  'Domingo': { count: 0, total: 0 },
  'Lunes': { count: 0, total: 0 },
  'Martes': { count: 0, total: 0 },
  'Miércoles': { count: 0, total: 0 },
  'Jueves': { count: 0, total: 0 },
  'Viernes': { count: 0, total: 0 },
  'Sábado': { count: 0, total: 0 }
}

sales.forEach(sale => {
  const date = new Date(sale.date)
  const dayName = date.toLocaleDateString('es-CO', { weekday: 'long' })
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  if (salesByDay[capitalizedDay]) {
    salesByDay[capitalizedDay].count++
    salesByDay[capitalizedDay].total += sale.total || 0
  }
})

// Ventas por mes
const salesByMonth = {}
sales.forEach(sale => {
  const date = new Date(sale.date)
  const monthKey = date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
  if (!salesByMonth[monthKey]) {
    salesByMonth[monthKey] = { count: 0, total: 0 }
  }
  salesByMonth[monthKey].count++
  salesByMonth[monthKey].total += sale.total || 0
})

// Productos vendidos
const productsSold = {}
sales.forEach(sale => {
  const items = JSON.parse(sale.items)
  items.forEach(item => {
    const productName = item.productName
    if (!productsSold[productName]) {
      productsSold[productName] = {
        quantity: 0,
        revenue: 0,
        sales: 0
      }
    }
    productsSold[productName].quantity += item.quantity || 0
    productsSold[productName].revenue += item.totalPrice || (item.unitPrice || 0) * (item.quantity || 0)
    productsSold[productName].sales++
  })
})

// Convertir a array y ordenar
const topProducts = Object.entries(productsSold)
  .map(([name, data]) => ({ name, ...data }))
  .sort((a, b) => b.revenue - a.revenue)

// Ventas por hora
const salesByHour = {}
sales.forEach(sale => {
  const hour = sale.hour !== null && sale.hour !== undefined ? sale.hour : new Date(sale.date).getHours()
  if (!salesByHour[hour]) {
    salesByHour[hour] = { count: 0, total: 0 }
  }
  salesByHour[hour].count++
  salesByHour[hour].total += sale.total || 0
})

// Ventas recientes (últimos 7 días)
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
const recentSales = sales.filter(sale => new Date(sale.date) >= sevenDaysAgo)
const recentRevenue = recentSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

// Ventas del mes actual
const now = new Date()
const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const monthSales = sales.filter(sale => new Date(sale.date) >= currentMonth)
const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

// Imprimir resultados
console.log('\n💰 RESUMEN GENERAL\n')
console.log(`  Total de ventas: ${totalSales}`)
console.log(`  Total vendido: $${totalRevenue.toLocaleString('es-CO')}`)
console.log(`  Promedio por venta: $${Math.round(averageTicket).toLocaleString('es-CO')}`)
console.log(`  Primera venta: ${firstSale.toLocaleDateString('es-CO')}`)
console.log(`  Última venta: ${lastSale.toLocaleDateString('es-CO')}`)

console.log('\n📅 VENTAS POR PERÍODO\n')
console.log(`  Últimos 7 días:`)
console.log(`    Ventas: ${recentSales.length}`)
console.log(`    Total: $${recentRevenue.toLocaleString('es-CO')}`)
console.log(`    Promedio diario: $${Math.round(recentRevenue / 7).toLocaleString('es-CO')}`)
console.log(`\n  Mes actual (${now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}):`)
console.log(`    Ventas: ${monthSales.length}`)
console.log(`    Total: $${monthRevenue.toLocaleString('es-CO')}`)

console.log('\n💳 MÉTODO DE PAGO\n')
Object.entries(paymentMethods)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([method, data]) => {
    const percentage = ((data.total / totalRevenue) * 100).toFixed(1)
    console.log(`  ${method}:`)
    console.log(`    Ventas: ${data.count} (${((data.count / totalSales) * 100).toFixed(1)}%)`)
    console.log(`    Total: $${data.total.toLocaleString('es-CO')} (${percentage}%)`)
  })

console.log('\n📆 VENTAS POR DÍA DE LA SEMANA\n')
Object.entries(salesByDay)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([day, data]) => {
    if (data.count > 0) {
      const avg = data.total / data.count
      console.log(`  ${day}:`)
      console.log(`    Ventas: ${data.count}`)
      console.log(`    Total: $${data.total.toLocaleString('es-CO')}`)
      console.log(`    Promedio: $${Math.round(avg).toLocaleString('es-CO')}`)
    }
  })

console.log('\n📅 VENTAS POR MES\n')
Object.entries(salesByMonth)
  .sort((a, b) => {
    // Ordenar por fecha (más reciente primero)
    const dateA = new Date(a[0])
    const dateB = new Date(b[0])
    return dateB - dateA
  })
  .slice(0, 6) // Últimos 6 meses
  .forEach(([month, data]) => {
    const avg = data.total / data.count
    console.log(`  ${month}:`)
    console.log(`    Ventas: ${data.count}`)
    console.log(`    Total: $${data.total.toLocaleString('es-CO')}`)
    console.log(`    Promedio: $${Math.round(avg).toLocaleString('es-CO')}`)
  })

console.log('\n⏰ VENTAS POR HORA\n')
const sortedHours = Object.entries(salesByHour)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  
sortedHours.forEach(([hour, data]) => {
  const avg = data.total / data.count
  const hourDisplay = `${hour.padStart(2, '0')}:00`
  console.log(`  ${hourDisplay}: ${data.count} ventas - $${data.total.toLocaleString('es-CO')} (promedio: $${Math.round(avg).toLocaleString('es-CO')})`)
})

console.log('\n🏆 TOP 15 PRODUCTOS MÁS VENDIDOS (por ingresos)\n')
topProducts.slice(0, 15).forEach((product, index) => {
  console.log(`  ${(index + 1).toString().padStart(2, ' ')}. ${product.name}`)
  console.log(`      Cantidad: ${product.quantity} unidades`)
  console.log(`      Ingresos: $${product.revenue.toLocaleString('es-CO')}`)
  console.log(`      En ${product.sales} venta${product.sales > 1 ? 's' : ''}`)
  console.log(`      Precio promedio: $${Math.round(product.revenue / product.quantity).toLocaleString('es-CO')}`)
})

console.log('\n📈 ANÁLISIS DE PRODUCTOS\n')
console.log(`  Total de productos diferentes vendidos: ${topProducts.length}`)
console.log(`  Producto más vendido (cantidad): ${topProducts.sort((a, b) => b.quantity - a.quantity)[0]?.name || 'N/A'}`)
console.log(`  Producto más rentable (ingresos): ${topProducts[0]?.name || 'N/A'}`)

// Distribución de montos de venta
const saleAmounts = sales.map(s => s.total || 0).sort((a, b) => a - b)
const median = saleAmounts[Math.floor(saleAmounts.length / 2)]
const maxSale = Math.max(...saleAmounts)
const minSale = Math.min(...saleAmounts)

console.log('\n💵 DISTRIBUCIÓN DE VENTAS\n')
console.log(`  Venta más grande: $${maxSale.toLocaleString('es-CO')}`)
console.log(`  Venta más pequeña: $${minSale.toLocaleString('es-CO')}`)
console.log(`  Mediana: $${median.toLocaleString('es-CO')}`)

// Categorizar ventas por tamaño
const smallSales = sales.filter(s => (s.total || 0) < 20000).length
const mediumSales = sales.filter(s => (s.total || 0) >= 20000 && (s.total || 0) < 50000).length
const largeSales = sales.filter(s => (s.total || 0) >= 50000 && (s.total || 0) < 100000).length
const xlargeSales = sales.filter(s => (s.total || 0) >= 100000).length

console.log('\n  Por tamaño:')
console.log(`    Menos de $20.000: ${smallSales} ventas (${((smallSales / totalSales) * 100).toFixed(1)}%)`)
console.log(`    $20.000 - $50.000: ${mediumSales} ventas (${((mediumSales / totalSales) * 100).toFixed(1)}%)`)
console.log(`    $50.000 - $100.000: ${largeSales} ventas (${((largeSales / totalSales) * 100).toFixed(1)}%)`)
console.log(`    Más de $100.000: ${xlargeSales} ventas (${((xlargeSales / totalSales) * 100).toFixed(1)}%)`)

console.log('\n' + '═'.repeat(80))
console.log('\n✅ Análisis completado\n')

db.close()
