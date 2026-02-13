/**
 * Registra venta del 12 feb 2026:
 * - 2 cervezas micheladas = $10.000 a las 10pm (22:00)
 * Cliente: Oscar Mono
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-02-12'
const now = new Date().toISOString()

function insertSale(hour, items, total, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, notes || null, now, now)
  return id
}

// 2 cervezas micheladas = $10.000 a las 10pm
// Precio unitario: $5.000 (precio especial o descuento)
const sale1 = [
  {
    productId: 'prod-1770687422697-le373wgmo',
    productName: 'Cerveza michelada',
    quantity: 2,
    unitPrice: 5000,
    totalPrice: 10000,
  },
]
insertSale(22, sale1, 10000, 'Oscar Mono — 2 cervezas micheladas — 10pm')
console.log('✓ 2 cervezas micheladas = $10.000 — 10pm (hora 22)')
console.log('  Cliente: Oscar Mono')

db.close()
console.log('\nListo. Venta registrada para el 12 feb 2026.')
