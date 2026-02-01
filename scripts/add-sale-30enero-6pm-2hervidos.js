/**
 * Agrega venta: 2 hervidos, 30 ene 2026 6pm, $14.000
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const now = new Date().toISOString()

db.prepare(`
  INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  id,
  '2026-01-30',
  18,
  JSON.stringify([{
    productId: 'bebida-1767479537737-5pcmv20sn',
    productName: 'Hervido de fruta de temporada',
    quantity: 2,
    unitPrice: 7000,
    totalPrice: 14000
  }]),
  14000,
  null,
  null,
  now,
  now
)

console.log('Venta agregada:')
console.log('  ID:', id)
console.log('  Fecha: 2026-01-30, Hora: 18:00 (6pm)')
console.log('  2 hervidos = $14.000')

db.close()
