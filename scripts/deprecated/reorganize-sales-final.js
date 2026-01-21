/**
 * Script para reorganizar las ventas según lo solicitado
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔄 Reorganizando ventas...\n')

// Obtener todas las ventas de interés
const sales = db.prepare('SELECT id, date, total FROM sales WHERE total IN (108000, 56500, 24500, 10500) ORDER BY total DESC').all()

console.log('Ventas encontradas:')
sales.forEach(s => {
  const d = new Date(s.date)
  console.log(`  ID: ${s.id}`)
  console.log(`  Fecha actual: ${d.toLocaleDateString('es-CO')}`)
  console.log(`  Total: $${s.total.toLocaleString('es-CO')}`)
  console.log('')
})

console.log('Aplicando cambios...\n')

// Dr. Pablo ($108.000) -> Sábado 17
const drPabloId = 'sale-1768845945713-li37b9wsv'
const drPabloSale = db.prepare('SELECT id, total FROM sales WHERE id = ?').get(drPabloId)
if (drPabloSale && drPabloSale.total === 108000) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-17T20:00:00.000Z', 20, drPabloId)
  console.log('✅ Dr. Pablo ($108.000) -> Sábado 17')
} else {
  console.log('⚠️  No se encontró venta Dr. Pablo')
}

// Mauricio ($56.500) -> Sábado 17
const mauricioId = 'sale-1768845945726-xd9z7cety'
const mauricioSale = db.prepare('SELECT id, total FROM sales WHERE id = ?').get(mauricioId)
if (mauricioSale && mauricioSale.total === 56500) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-17T20:00:00.000Z', 20, mauricioId)
  console.log('✅ Mauricio ($56.500) -> Sábado 17')
} else {
  console.log('⚠️  No se encontró venta Mauricio')
}

// Venta $24.500 -> Viernes 16
const sale24500Id = 'sale-1768843907626-o4fyt4fzg'
const sale24500 = db.prepare('SELECT id, total FROM sales WHERE id = ?').get(sale24500Id)
if (sale24500 && sale24500.total === 24500) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-16T20:00:00.000Z', 20, sale24500Id)
  console.log('✅ Venta $24.500 -> Viernes 16')
} else {
  console.log('⚠️  No se encontró venta $24.500')
}

// Venta $10.500 -> Domingo 18
const sale10500Id = 'sale-1768843907628-lxccmynjn'
const sale10500 = db.prepare('SELECT id, total FROM sales WHERE id = ?').get(sale10500Id)
if (sale10500 && sale10500.total === 10500) {
  db.prepare('UPDATE sales SET date = ?, hour = ? WHERE id = ?').run('2026-01-18T20:00:00.000Z', 20, sale10500Id)
  console.log('✅ Venta $10.500 -> Domingo 18')
} else {
  console.log('⚠️  No se encontró venta $10.500')
}

console.log('\n✅ Reorganización completada\n')

// Verificar resultado
const finalSales = db.prepare("SELECT id, date, total FROM sales WHERE date >= '2026-01-16' AND date <= '2026-01-19' ORDER BY date DESC, total DESC").all()

console.log('📊 RESULTADO FINAL:\n')

const byDate = {}
finalSales.forEach(s => {
  const dateKey = new Date(s.date).toISOString().split('T')[0]
  if (!byDate[dateKey]) {
    byDate[dateKey] = []
  }
  byDate[dateKey].push(s)
})

Object.keys(byDate).sort().reverse().forEach(dateKey => {
  const date = new Date(dateKey)
  const daySales = byDate[dateKey]
  const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0)
  const dayName = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  
  console.log(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)}:`)
  console.log(`  Ventas: ${daySales.length}`)
  daySales.forEach(s => {
    console.log(`    - $${s.total.toLocaleString('es-CO')}`)
  })
  console.log(`  Total: $${dayTotal.toLocaleString('es-CO')}\n`)
})

db.close()
