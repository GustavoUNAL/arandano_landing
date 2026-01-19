/**
 * Script para verificar la organización de ventas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 VERIFICANDO ORGANIZACIÓN DE VENTAS\n')

// Agrupar ventas por fecha
const sales = db.prepare("SELECT id, date, total, items FROM sales WHERE date >= '2026-01-16' AND date <= '2026-01-19' ORDER BY date DESC, hour DESC").all()

const salesByDate = {}
sales.forEach(sale => {
  const date = new Date(sale.date)
  const dateKey = date.toISOString().split('T')[0]
  
  if (!salesByDate[dateKey]) {
    salesByDate[dateKey] = []
  }
  
  salesByDate[dateKey].push(sale)
})

// Mostrar por fecha
Object.keys(salesByDate).sort().reverse().forEach(dateKey => {
  const date = new Date(dateKey)
  const daySales = salesByDate[dateKey]
  const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0)
  
  const dayName = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  console.log(`\n📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}:`)
  console.log(`   Ventas: ${daySales.length}`)
  console.log(`   Total del día: $${dayTotal.toLocaleString('es-CO')}\n`)
  
  daySales.forEach((sale, index) => {
    const items = JSON.parse(sale.items)
    const saleDate = new Date(sale.date)
    console.log(`   ${index + 1}. ${saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - $${sale.total.toLocaleString('es-CO')}`)
    console.log(`      Items:`)
    items.forEach(item => {
      const totalPrice = item.totalPrice || (item.unitPrice * item.quantity) || item.price || 0
      const unitPrice = item.unitPrice || item.price || 0
      console.log(`        - ${item.quantity}x ${item.productName} ($${unitPrice.toLocaleString('es-CO')} c/u)`)
    })
    console.log('')
  })
})

// Verificar totales esperados
console.log('\n✅ VERIFICACIÓN:\n')

const viernes16 = salesByDate['2026-01-16'] || []
const sabado17 = salesByDate['2026-01-17'] || []
const domingo18 = salesByDate['2026-01-18'] || []

const totalViernes = viernes16.reduce((sum, s) => sum + s.total, 0)
const totalSabado = sabado17.reduce((sum, s) => sum + s.total, 0)
const totalDomingo = domingo18.reduce((sum, s) => sum + s.total, 0)

console.log(`Viernes 16: $${totalViernes.toLocaleString('es-CO')} (esperado: $24.500) ${totalViernes === 24500 ? '✅' : '❌'}`)
console.log(`Sábado 17: $${totalSabado.toLocaleString('es-CO')} (esperado: $164.500) ${totalSabado === 164500 ? '✅' : '❌'}`)
console.log(`Domingo 18: $${totalDomingo.toLocaleString('es-CO')} (esperado: $10.500) ${totalDomingo === 10500 ? '✅' : '❌'}`)

db.close()
