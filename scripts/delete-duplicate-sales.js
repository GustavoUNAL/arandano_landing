/**
 * Script para eliminar ventas duplicadas del 16 y 18 de enero
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// IDs de las ventas anteriores (las que queremos eliminar)
const oldSaleIds = [
  'sale-1768843606267-08ar9wn4z', // Viernes 16 - primera versión
  'sale-1768843606270-b7m8hodqd'  // Domingo 18 - primera versión
]

console.log('\n🗑️  Eliminando ventas duplicadas...\n')

oldSaleIds.forEach(saleId => {
  const sale = db.prepare('SELECT id, date, total FROM sales WHERE id = ?').get(saleId)
  if (sale) {
    db.prepare('DELETE FROM sales WHERE id = ?').run(saleId)
    console.log(`   ✅ Eliminada venta ${saleId} - Fecha: ${sale.date}, Total: $${sale.total.toLocaleString('es-CO')}`)
  } else {
    console.log(`   ⚠️  Venta ${saleId} no encontrada`)
  }
})

console.log('\n✅ Proceso completado\n')

db.close()
