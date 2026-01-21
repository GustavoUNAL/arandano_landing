/**
 * Script para verificar la organización final de ventas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 VERIFICACIÓN FINAL DE ORGANIZACIÓN DE VENTAS\n')

const sales = db.prepare('SELECT id, date, total, items FROM sales WHERE total IN (108000, 56500, 24500, 10500) ORDER BY date').all()

// Agrupar como lo hace el frontend
const salesByDay = {}
sales.forEach(sale => {
  const saleDate = new Date(sale.date)
  const year = saleDate.getFullYear()
  const month = String(saleDate.getMonth() + 1).padStart(2, '0')
  const day = String(saleDate.getDate()).padStart(2, '0')
  const dayKey = `${day}/${month}/${year}`
  
  if (!salesByDay[dayKey]) {
    salesByDay[dayKey] = []
  }
  salesByDay[dayKey].push(sale)
})

// Mostrar resultados
Object.keys(salesByDay).sort().forEach(key => {
  const daySales = salesByDay[key]
  const dayTotal = daySales.reduce((sum, sale) => sum + sale.total, 0)
  // Usar la fecha de la primera venta del día para obtener el nombre correcto
  const firstSaleDate = new Date(daySales[0].date)
  const dayName = firstSaleDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  
  console.log(`\n📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}:`)
  console.log(`   Ventas: ${daySales.length}`)
  console.log(`   Total del día: $${dayTotal.toLocaleString('es-CO')}\n`)
  
  daySales.forEach(sale => {
    const items = JSON.parse(sale.items)
    console.log(`   - $${sale.total.toLocaleString('es-CO')}`)
    items.forEach(item => {
      console.log(`     ${item.quantity}x ${item.productName}`)
    })
  })
})

console.log('\n✅ VERIFICACIÓN:\n')

const expected = {
  '16/01/2026': 24500,
  '17/01/2026': 164500,
  '18/01/2026': 10500
}

Object.keys(expected).forEach(key => {
  const actualTotal = salesByDay[key] ? salesByDay[key].reduce((sum, sale) => sum + sale.total, 0) : 0
  const status = actualTotal === expected[key] ? '✅' : '❌'
  // Usar la fecha de la primera venta del día para obtener el nombre correcto
  const firstSaleDate = salesByDay[key] ? new Date(salesByDay[key][0].date) : null
  const dayName = firstSaleDate ? firstSaleDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) : key
  console.log(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)}: $${actualTotal.toLocaleString('es-CO')} (esperado: $${expected[key].toLocaleString('es-CO')}) ${status}`)
})

db.close()
