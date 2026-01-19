/**
 * Script para verificar las ventas registradas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📊 Ventas de enero 2026:\n')

const sales = db.prepare("SELECT id, date, total, items FROM sales WHERE date LIKE '2026-01-%' ORDER BY date DESC LIMIT 10").all()

sales.forEach(s => {
  const items = JSON.parse(s.items)
  const date = new Date(s.date)
  console.log(`Fecha: ${date.toLocaleDateString('es-CO')} ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`)
  console.log(`Total: $${s.total.toLocaleString('es-CO')}`)
  console.log(`Items:`)
  items.forEach(item => {
    const totalPrice = item.totalPrice || (item.unitPrice * item.quantity) || item.price || 0
    const unitPrice = item.unitPrice || item.price || 0
    console.log(`  - ${item.quantity}x ${item.productName} - $${totalPrice.toLocaleString('es-CO')} ($${unitPrice.toLocaleString('es-CO')} c/u)`)
  })
  console.log(`ID: ${s.id}`)
  console.log('---\n')
})

db.close()
