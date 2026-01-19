/**
 * Script para actualizar ventas específicas al sábado 17 de enero de 2026 a las 08:00 p.m.
 * - Venta de $56.500 con 3 productos, efectivo
 * - Venta de $108.000 con 5 productos, efectivo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 Actualizando ventas al sábado 17 de enero de 2026 a las 08:00 p.m...\n')

// Nueva fecha: sábado 17 de enero de 2026 a las 08:00 p.m (20:00)
const targetDate = '2026-01-17T20:00:00.000Z'
const targetHour = 20

// Buscar ventas que coincidan con los criterios
// Venta de $56.500 con 3 productos, efectivo
const sales56500 = db.prepare(`
  SELECT id, date, hour, total, paymentMethod, items 
  FROM sales 
  WHERE total = 56500 
  ORDER BY date DESC
`).all()

console.log(`📊 Ventas encontradas de $56.500: ${sales56500.length}`)
sales56500.forEach(sale => {
  const items = JSON.parse(sale.items)
  const d = new Date(sale.date)
  console.log(`  ID: ${sale.id}`)
  console.log(`  Fecha actual: ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
  console.log(`  Hora actual: ${sale.hour || d.getHours()}:00`)
  console.log(`  Productos: ${items.length}`)
  console.log(`  Método de pago: ${sale.paymentMethod || 'N/A'}`)
  console.log('')
})

// Venta de $108.000 con 5 productos, efectivo
const sales108000 = db.prepare(`
  SELECT id, date, hour, total, paymentMethod, items 
  FROM sales 
  WHERE total = 108000 
  ORDER BY date DESC
`).all()

console.log(`📊 Ventas encontradas de $108.000: ${sales108000.length}`)
sales108000.forEach(sale => {
  const items = JSON.parse(sale.items)
  const d = new Date(sale.date)
  console.log(`  ID: ${sale.id}`)
  console.log(`  Fecha actual: ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
  console.log(`  Hora actual: ${sale.hour || d.getHours()}:00`)
  console.log(`  Productos: ${items.length}`)
  console.log(`  Método de pago: ${sale.paymentMethod || 'N/A'}`)
  console.log('')
})

// Buscar la venta de $56.500 con 3 productos y efectivo
let sale56500ToUpdate = null
for (const sale of sales56500) {
  const items = JSON.parse(sale.items)
  if (items.length === 3 && sale.paymentMethod === 'efectivo') {
    sale56500ToUpdate = sale
    break
  }
}

// Buscar la venta de $108.000 con 5 productos y efectivo
let sale108000ToUpdate = null
for (const sale of sales108000) {
  const items = JSON.parse(sale.items)
  if (items.length === 5 && sale.paymentMethod === 'efectivo') {
    sale108000ToUpdate = sale
    break
  }
}

// Actualizar las ventas
console.log('\n🔄 Actualizando ventas...\n')

if (sale56500ToUpdate) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run(
    targetDate,
    targetHour,
    sale56500ToUpdate.id
  )
  console.log(`✅ Venta de $56.500 (3 productos, efectivo) actualizada al sábado 17 de enero de 2026 a las 08:00 p.m.`)
  console.log(`   ID: ${sale56500ToUpdate.id}\n`)
} else {
  console.log('⚠️  No se encontró venta de $56.500 con 3 productos y efectivo\n')
}

if (sale108000ToUpdate) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run(
    targetDate,
    targetHour,
    sale108000ToUpdate.id
  )
  console.log(`✅ Venta de $108.000 (5 productos, efectivo) actualizada al sábado 17 de enero de 2026 a las 08:00 p.m.`)
  console.log(`   ID: ${sale108000ToUpdate.id}\n`)
} else {
  console.log('⚠️  No se encontró venta de $108.000 con 5 productos y efectivo\n')
}

// Verificar resultado
console.log('\n📋 Verificando resultado:\n')

if (sale56500ToUpdate) {
  const updated = db.prepare('SELECT id, date, hour, total FROM sales WHERE id = ?').get(sale56500ToUpdate.id)
  if (updated) {
    const d = new Date(updated.date)
    console.log(`Venta $56.500:`)
    console.log(`  Fecha: ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
    console.log(`  Hora: ${updated.hour}:00`)
    console.log('')
  }
}

if (sale108000ToUpdate) {
  const updated = db.prepare('SELECT id, date, hour, total FROM sales WHERE id = ?').get(sale108000ToUpdate.id)
  if (updated) {
    const d = new Date(updated.date)
    console.log(`Venta $108.000:`)
    console.log(`  Fecha: ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)
    console.log(`  Hora: ${updated.hour}:00`)
    console.log('')
  }
}

console.log('✅ Actualización completada\n')

db.close()
