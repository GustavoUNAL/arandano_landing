/**
 * Script para eliminar venta duplicada incorrecta del domingo 18
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔍 Buscando ventas duplicadas del 18-19 de enero...\n')

// Buscar ventas del 18-19 de enero con 3 cervezas Poker
const sales = db.prepare("SELECT id, date, total, items FROM sales WHERE date LIKE '2026-01-1%' ORDER BY date DESC").all()

console.log('Ventas encontradas:')
sales.forEach(s => {
  const items = JSON.parse(s.items)
  const date = new Date(s.date)
  console.log(`\nID: ${s.id}`)
  console.log(`Fecha: ${date.toLocaleDateString('es-CO')} ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`)
  console.log(`Total: $${s.total.toLocaleString('es-CO')}`)
  console.log(`Items:`)
  items.forEach(item => {
    const totalPrice = item.totalPrice || (item.unitPrice * item.quantity) || item.price || 0
    const unitPrice = item.unitPrice || item.price || 0
    console.log(`  - ${item.quantity}x ${item.productName} - $${totalPrice.toLocaleString('es-CO')} ($${unitPrice.toLocaleString('es-CO')} c/u)`)
  })
})

// Eliminar la venta con precio incorrecto ($18.375 con precio unitario $6.125)
const wrongSaleId = 'sale-1768843715585-5hgf4wk4t'
const wrongSale = db.prepare('SELECT id, total FROM sales WHERE id = ?').get(wrongSaleId)

if (wrongSale && wrongSale.total === 18.375) {
  console.log(`\n🗑️  Eliminando venta incorrecta: ${wrongSaleId}`)
  db.prepare('DELETE FROM sales WHERE id = ?').run(wrongSaleId)
  console.log('✅ Venta eliminada')
} else {
  console.log(`\n⚠️  Venta ${wrongSaleId} no encontrada o ya fue eliminada`)
}

console.log('\n✅ Verificación completada\n')

db.close()
