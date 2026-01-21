/**
 * Script para corregir las fechas de las ventas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 Corrigiendo fechas de ventas...\n')

// Obtener todas las ventas de interés
const sales = db.prepare('SELECT id, date, total FROM sales WHERE total IN (108000, 56500, 24500, 10500) ORDER BY date DESC').all()

console.log('Ventas encontradas:')
sales.forEach(s => {
  const d = new Date(s.date)
  console.log(`  ID: ${s.id}`)
  console.log(`  Fecha actual: ${d.toLocaleDateString('es-CO')}`)
  console.log(`  Total: $${s.total.toLocaleString('es-CO')}`)
  console.log('')
})

// Corregir fechas
console.log('Aplicando correcciones...\n')

// Venta Dr. Pablo ($108.000) -> Viernes 16
const drPablo = db.prepare('SELECT id FROM sales WHERE id = ?').get('sale-1768845945713-li37b9wsv')
if (drPablo) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-16T20:00:00.000Z', 20, drPablo.id)
  console.log('✅ Venta Dr. Pablo ($108.000) -> Viernes 16')
}

// Venta Mauricio ($56.500) -> Viernes 16
const mauricio = db.prepare('SELECT id FROM sales WHERE id = ?').get('sale-1768845945726-xd9z7cety')
if (mauricio) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-16T20:00:00.000Z', 20, mauricio.id)
  console.log('✅ Venta Mauricio ($56.500) -> Viernes 16')
}

// Venta $24.500 -> Sábado 17
const sale24500 = db.prepare('SELECT id FROM sales WHERE id = ?').get('sale-1768843907626-o4fyt4fzg')
if (sale24500) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-17T20:00:00.000Z', 20, sale24500.id)
  console.log('✅ Venta $24.500 -> Sábado 17')
}

// Venta $10.500 -> Sábado 17 (ya está en domingo 18, cambiarla)
const sale10500 = db.prepare('SELECT id FROM sales WHERE id = ?').get('sale-1768843907628-lxccmynjn')
if (sale10500) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-17T20:00:00.000Z', 20, sale10500.id)
  console.log('✅ Venta $10.500 -> Sábado 17')
}

console.log('\n✅ Fechas corregidas\n')

// Verificar resultado
const finalSales = db.prepare('SELECT id, date, total FROM sales WHERE total IN (108000, 56500, 24500, 10500) ORDER BY date DESC').all()

console.log('Ventas después de la corrección:')
finalSales.forEach(s => {
  const d = new Date(s.date)
  console.log(`  ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} - $${s.total.toLocaleString('es-CO')}`)
})

db.close()
