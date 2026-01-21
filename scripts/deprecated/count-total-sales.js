/**
 * Script para contar todas las ventas del historial
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 ANÁLISIS DE VENTAS HISTÓRICAS\n')
console.log('=' .repeat(50))

// Contar total de ventas
const totalCount = db.prepare('SELECT COUNT(*) as count FROM sales').get()
console.log(`\n🛒 TOTAL DE VENTAS: ${totalCount.count}`)

// Obtener todas las ventas para análisis detallado
const allSales = db.prepare('SELECT date, hour, total, paymentMethod FROM sales ORDER BY date ASC, hour ASC').all()

if (allSales.length === 0) {
  console.log('\n⚠️  No se encontraron ventas en la base de datos.\n')
  db.close()
  process.exit(0)
}

// Calcular total recaudado
const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
console.log(`💰 TOTAL RECAUDADO: $${totalRevenue.toLocaleString('es-CO')}`)

// Calcular promedio por venta
const avgPerSale = totalRevenue / allSales.length
console.log(`📈 PROMEDIO POR VENTA: $${avgPerSale.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

// Análisis por fecha (primera y última venta)
const firstSale = allSales[0]
const lastSale = allSales[allSales.length - 1]

console.log(`\n📅 PRIMERA VENTA: ${new Date(firstSale.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
console.log(`📅 ÚLTIMA VENTA: ${new Date(lastSale.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)

// Calcular días entre primera y última venta
const firstDate = new Date(firstSale.date)
const lastDate = new Date(lastSale.date)
const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))
console.log(`⏱️  PERÍODO: ${daysDiff} días`)

// Ventas por método de pago
const paymentMethods = {}
allSales.forEach(sale => {
  const method = sale.paymentMethod || 'No especificado'
  if (!paymentMethods[method]) {
    paymentMethods[method] = { count: 0, total: 0 }
  }
  paymentMethods[method].count++
  paymentMethods[method].total += sale.total || 0
})

console.log(`\n💳 VENTAS POR MÉTODO DE PAGO:`)
Object.keys(paymentMethods).sort().forEach(method => {
  const stats = paymentMethods[method]
  const percentage = ((stats.count / allSales.length) * 100).toFixed(1)
  console.log(`   ${method}: ${stats.count} ventas (${percentage}%) - $${stats.total.toLocaleString('es-CO')}`)
})

// Ventas por mes/año
const salesByMonth = {}
allSales.forEach(sale => {
  const date = new Date(sale.date)
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  if (!salesByMonth[monthKey]) {
    salesByMonth[monthKey] = { count: 0, total: 0 }
  }
  salesByMonth[monthKey].count++
  salesByMonth[monthKey].total += sale.total || 0
})

console.log(`\n📆 VENTAS POR MES:`)
Object.keys(salesByMonth).sort().forEach(monthKey => {
  const [year, month] = monthKey.split('-')
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const stats = salesByMonth[monthKey]
  console.log(`   ${monthNames[parseInt(month) - 1]} ${year}: ${stats.count} ventas - $${stats.total.toLocaleString('es-CO')}`)
})

// Venta más grande y más pequeña
const salesByAmount = allSales.map(s => s.total || 0).sort((a, b) => a - b)
const smallestSale = salesByAmount[0]
const largestSale = salesByAmount[salesByAmount.length - 1]

console.log(`\n📊 EXTREMOS:`)
console.log(`   Venta más pequeña: $${smallestSale.toLocaleString('es-CO')}`)
console.log(`   Venta más grande: $${largestSale.toLocaleString('es-CO')}`)

console.log('\n' + '='.repeat(50))
console.log('✅ Análisis completado\n')

db.close()
