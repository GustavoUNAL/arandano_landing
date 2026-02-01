/**
 * Corrige las ventas del viernes 30 de enero 2026:
 * 1. Cambiar hora de 23 a 19 (7pm) para las 7 ventas
 * 2. Mover ventas de 5pm ($7000 efectivo) y 6pm ($14000 nequi) del 29 al 30
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

// 1. Cambiar hora de 23 a 19 para ventas del 30
const salesAt23 = db.prepare("SELECT id FROM sales WHERE date = '2026-01-30' AND hour = 23").all()
console.log(`Cambiando ${salesAt23.length} ventas de hora 23 a 19 (7pm)...`)
salesAt23.forEach(s => {
  db.prepare("UPDATE sales SET hour = 19, updatedAt = ? WHERE id = ?").run(now, s.id)
  console.log('  -', s.id)
})

// 2. Mover venta de 5pm ($7000 café+acompañante, efectivo) del 29 al 30
const sale5pm = db.prepare("SELECT id, total, paymentMethod FROM sales WHERE date = '2026-01-29' AND hour = 17 AND total = 7000 AND paymentMethod = 'efectivo'").get()
if (sale5pm) {
  db.prepare("UPDATE sales SET date = '2026-01-30', updatedAt = ? WHERE id = ?").run(now, sale5pm.id)
  console.log('\nMovida venta 5pm del 29 al 30:', sale5pm.id, '$7.000 efectivo')
}

// 3. Mover venta de 6pm ($14000 2 hervidos, nequi) del 29 al 30
const sale6pm = db.prepare("SELECT id, total, paymentMethod FROM sales WHERE date = '2026-01-29' AND hour = 18 AND total = 14000 AND paymentMethod = 'nequi'").get()
if (sale6pm) {
  db.prepare("UPDATE sales SET date = '2026-01-30', updatedAt = ? WHERE id = ?").run(now, sale6pm.id)
  console.log('Movida venta 6pm del 29 al 30:', sale6pm.id, '$14.000 nequi')
}

// Verificar resultado
const final = db.prepare("SELECT date, hour, total, paymentMethod, notes, items FROM sales WHERE date = '2026-01-30' ORDER BY hour, id").all()
console.log('\n=== Ventas del viernes 30 de enero (corregidas) ===')
final.forEach(s => {
  const items = JSON.parse(s.items).map(i => i.quantity + '× ' + i.productName).join(', ')
  console.log(`${s.hour}:00 | $${s.total.toLocaleString('es-CO')} | ${s.paymentMethod || 'sin pago'} | ${items.slice(0,50)}`)
})

console.log('\nTotal ventas:', final.length)
console.log('Total día: $' + final.reduce((sum, s) => sum + s.total, 0).toLocaleString('es-CO'))

db.close()
console.log('\nListo.')
