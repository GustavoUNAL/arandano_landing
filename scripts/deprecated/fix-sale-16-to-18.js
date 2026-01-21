/**
 * Script para corregir la venta del 16 de enero y moverla al domingo 18
 * La venta sale-1768843907626-o4fyt4fzg tiene productos que se vendieron el domingo 18
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 Corrigiendo venta del 16 de enero al domingo 18...\n')

const saleId = 'sale-1768843907626-o4fyt4fzg'
const sale = db.prepare('SELECT id, date, hour, total, items FROM sales WHERE id = ?').get(saleId)

if (sale) {
  console.log('Venta encontrada:')
  console.log(`  ID: ${sale.id}`)
  console.log(`  Fecha actual: ${sale.date}`)
  console.log(`  Hora actual: ${sale.hour}`)
  console.log(`  Total: $${sale.total}`)
  
  // Cambiar fecha al domingo 18 de enero de 2026, 8pm hora local Colombia
  // 8pm hora local (UTC-5) = 1am UTC del día siguiente (19 de enero)
  // Pero como es domingo 18, necesitamos 8pm del 18 = 1am UTC del 19
  const targetDate = new Date('2026-01-19T01:00:00.000Z') // 8pm del 18 en hora local
  const targetHour = 20 // 8pm
  
  console.log(`\nActualizando a:`)
  console.log(`  Fecha: ${targetDate.toISOString()}`)
  console.log(`  Hora: ${targetHour}:00`)
  console.log(`  Día local: ${targetDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`)
  
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run(
    targetDate.toISOString(),
    targetHour,
    saleId
  )
  
  const updated = db.prepare('SELECT date, hour FROM sales WHERE id = ?').get(saleId)
  console.log(`\n✅ Venta actualizada:`)
  console.log(`  Fecha DB: ${updated.date}`)
  console.log(`  Hora DB: ${updated.hour}`)
  
  const d = new Date(updated.date)
  console.log(`  Día local: ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`)
} else {
  console.log('❌ Venta no encontrada')
}

console.log('\n✅ Proceso completado\n')
db.close()
