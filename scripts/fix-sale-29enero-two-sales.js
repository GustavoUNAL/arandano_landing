/**
 * Separa la venta del 29 ene 6pm en dos ventas:
 * 1. Cliente Organanicos - 2 hervidos = 10.000
 * 2. Cliente Sebastian - 2 cervezas = 7.000
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const OLD_SALE_ID = 'sale-1769814481491-qq5rlb3ba'

// Eliminar la venta unificada
const del = db.prepare('DELETE FROM sales WHERE id = ?').run(OLD_SALE_ID)
if (del.changes === 0) {
  console.log('No se encontró la venta anterior (puede que ya se haya separado).')
} else {
  console.log('Venta unificada eliminada:', OLD_SALE_ID)
}

function insertSale(date, hour, items, total, comment) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, comment, now, now)
  return id
}

const date = '2026-01-29'
const hour = 18

// Venta 1: Cliente Organanicos - 2 hervidos
const id1 = insertSale(date, hour, [
  {
    productId: 'bebida-1767479537737-5pcmv20sn',
    productName: 'Hervido de fruta de temporada ',
    quantity: 2,
    unitPrice: 5000,
    totalPrice: 10000
  }
], 10000, 'Cliente Organanicos')

// Pequeña pausa para que el ID sea distinto
const id2 = insertSale(date, hour, [
  {
    productId: 'cerveza-poker-330',
    productName: 'Cerveza Poker 330cm3',
    quantity: 2,
    unitPrice: 3500,
    totalPrice: 7000
  }
], 7000, 'Cliente Sebastian')

console.log('\nVentas creadas:')
console.log('  1.', id1, '- 2 hervidos $10.000 — Cliente Organanicos')
console.log('  2.', id2, '- 2 cervezas $7.000 — Cliente Sebastian')

db.close()
