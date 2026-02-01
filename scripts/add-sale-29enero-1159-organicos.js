/**
 * Agrega venta del 29 ene 2026 a las 11:59pm - Clientes organicos:
 * - 6 hervidos = 30.000
 * - 2 cervezas Águila (light) = 7.000
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

function insertSale(date, hour, items, total, comment) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, comment, now, now)
  return id
}

const id = insertSale('2026-01-29', 23, [
  {
    productId: 'bebida-1767479537737-5pcmv20sn',
    productName: 'Hervido de fruta de temporada ',
    quantity: 6,
    unitPrice: 5000,
    totalPrice: 30000
  },
  {
    productId: 'cerveza-aguila-330',
    productName: 'Cerveza Águila 330cm3',
    quantity: 2,
    unitPrice: 3500,
    totalPrice: 7000
  }
], 37000, 'Clientes organicos')

console.log('Venta agregada:')
console.log('  ID:', id)
console.log('  Fecha: 2026-01-29, Hora: 23:59 (11:59pm)')
console.log('  6 hervidos $30.000 + 2 cervezas Águila $7.000 = $37.000')
console.log('  Comentario: Clientes organicos')

db.close()
