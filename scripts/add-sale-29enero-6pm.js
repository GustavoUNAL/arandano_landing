/**
 * Agrega venta del 29 de enero de 2026 a las 6pm:
 * - 2 hervidos = 10.000
 * - 2 cervezas = 7.000
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const sale = {
  date: '2026-01-29',
  hour: 18,
  items: [
    {
      productId: 'bebida-1767479537737-5pcmv20sn',
      productName: 'Hervido de fruta de temporada ',
      quantity: 2,
      unitPrice: 5000,
      totalPrice: 10000
    },
    {
      productId: 'cerveza-poker-330',
      productName: 'Cerveza Poker 330cm3',
      quantity: 2,
      unitPrice: 3500,
      totalPrice: 7000
    }
  ],
  total: 17000,
  paymentMethod: null,
  comment: null
}

const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const now = new Date().toISOString()

db.prepare(`
  INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  id,
  sale.date,
  sale.hour,
  JSON.stringify(sale.items),
  sale.total,
  sale.paymentMethod || null,
  sale.comment || null,
  now,
  now
)

console.log('Venta agregada correctamente:')
console.log('  ID:', id)
console.log('  Fecha:', sale.date, 'Hora: 18:00 (6pm)')
console.log('  Items: 2 Hervido de fruta de temporada ($10.000) + 2 Cerveza Poker 330cm3 ($7.000)')
console.log('  Total: $17.000')

db.close()
