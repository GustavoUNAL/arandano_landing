/**
 * Script para corregir la venta que tiene fecha incorrecta
 * 2026-01-17T20:00:00.000Z debería ser 2026-01-18T01:00:00.000Z (8pm hora local = 1am UTC siguiente día)
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 Corrigiendo fecha incorrecta...\n')

const saleId = 'sale-1768845945726-xd9z7cety'
const sale = db.prepare('SELECT id, date, hour FROM sales WHERE id = ?').get(saleId)

if (sale) {
  console.log(`Venta encontrada: ${sale.id}`)
  console.log(`  Fecha actual: ${sale.date}`)
  console.log(`  Hora guardada: ${sale.hour}`)
  
  // Si la fecha es 2026-01-17T20:00:00.000Z y la hora es 20,
  // significa que se guardó como 8pm UTC cuando debería ser 8pm hora local
  // 8pm hora local (Colombia UTC-5) = 1am UTC del día siguiente
  if (sale.date === '2026-01-17T20:00:00.000Z' && sale.hour === 20) {
    // Crear fecha correcta: 17 de enero 2026, 8pm hora local Colombia
    // Esto se convierte a: 18 de enero 2026, 1am UTC
    const correctDate = new Date('2026-01-17T20:00:00-05:00').toISOString()
    
    console.log(`  Corrigiendo a: ${correctDate}`)
    
    db.prepare('UPDATE sales SET date = ? WHERE id = ?').run(correctDate, saleId)
    
    const updated = db.prepare('SELECT date, hour FROM sales WHERE id = ?').get(saleId)
    console.log(`  ✅ Fecha actualizada: ${updated.date}`)
  } else {
    console.log('  ℹ️  La venta no necesita corrección')
  }
} else {
  console.log('❌ Venta no encontrada')
}

console.log('\n✅ Verificación completada\n')
db.close()
