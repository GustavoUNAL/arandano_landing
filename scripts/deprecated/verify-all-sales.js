/**
 * Script para verificar y organizar todas las ventas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 VERIFICANDO TODAS LAS VENTAS\n')

// Obtener todas las ventas
const allSales = db.prepare('SELECT id, date, hour, total, items, paymentMethod FROM sales ORDER BY date DESC, hour DESC').all()

console.log(`Total de ventas en la base de datos: ${allSales.length}\n`)

// Agrupar por fecha
const salesByDate = {}
allSales.forEach(sale => {
  const date = new Date(sale.date)
  const dateKey = date.toISOString().split('T')[0]
  
  if (!salesByDate[dateKey]) {
    salesByDate[dateKey] = []
  }
  
  salesByDate[dateKey].push(sale)
})

// Mostrar ventas agrupadas por fecha
Object.keys(salesByDate).sort().reverse().forEach(dateKey => {
  const date = new Date(dateKey)
  const sales = salesByDate[dateKey]
  const dayTotal = sales.reduce((sum, s) => sum + s.total, 0)
  
  console.log(`\n📅 ${date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
  console.log(`   Total del día: $${dayTotal.toLocaleString('es-CO')}`)
  console.log(`   Ventas: ${sales.length}`)
  
  sales.forEach((sale, index) => {
    const items = JSON.parse(sale.items)
    const saleDate = new Date(sale.date)
    console.log(`\n   ${index + 1}. Venta ${sale.id.substring(0, 20)}...`)
    console.log(`      Hora: ${saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`)
    console.log(`      Total: $${sale.total.toLocaleString('es-CO')}`)
    console.log(`      Método de pago: ${sale.paymentMethod || 'No especificado'}`)
    console.log(`      Items:`)
    items.forEach(item => {
      const totalPrice = item.totalPrice || (item.unitPrice * item.quantity) || item.price || 0
      const unitPrice = item.unitPrice || item.price || 0
      console.log(`        - ${item.quantity}x ${item.productName} ($${unitPrice.toLocaleString('es-CO')} c/u) = $${totalPrice.toLocaleString('es-CO')}`)
    })
  })
})

// Verificar problemas
console.log('\n\n🔍 VERIFICANDO PROBLEMAS:\n')

// Ventas sin paymentMethod
const salesWithoutPayment = allSales.filter(s => !s.paymentMethod)
if (salesWithoutPayment.length > 0) {
  console.log(`⚠️  ${salesWithoutPayment.length} ventas sin método de pago:`)
  salesWithoutPayment.forEach(s => {
    console.log(`   - ${s.id} (${new Date(s.date).toLocaleDateString('es-CO')})`)
  })
}

// Ventas con items mal formateados
let itemsIssues = 0
allSales.forEach(sale => {
  try {
    const items = JSON.parse(sale.items)
    items.forEach(item => {
      if (!item.productId || !item.productName) {
        itemsIssues++
      }
    })
  } catch (e) {
    itemsIssues++
  }
})

if (itemsIssues > 0) {
  console.log(`\n⚠️  ${itemsIssues} items con problemas de formato`)
}

// Resumen
const totalSales = allSales.reduce((sum, s) => sum + s.total, 0)
console.log(`\n\n💰 RESUMEN TOTAL:`)
console.log(`   Total de ventas: ${allSales.length}`)
console.log(`   Total recaudado: $${totalSales.toLocaleString('es-CO')}`)

console.log('\n✅ Verificación completada\n')

db.close()
