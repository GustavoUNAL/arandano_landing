/**
 * Agrega venta del viernes 13 feb 2026 a las 10pm:
 * 7 hervidos = $49.000, efectivo. Comentario: guillermo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-02-13'
const hour = 22 // 10pm
const now = new Date().toISOString()

const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const items = [
  {
    productId: 'bebida-1767479537737-5pcmv20sn',
    productName: 'Hervido de fruta de temporada',
    quantity: 7,
    unitPrice: 7000,
    totalPrice: 49000,
  },
]

const tableInfo = db.prepare('PRAGMA table_info(sales)').all()
const hasMesa = tableInfo.some(col => col.name === 'mesa')

if (hasMesa) {
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, mesa, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), 49000, 'efectivo', 'guillermo', null, now, now)
} else {
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), 49000, 'efectivo', 'guillermo', now, now)
}

console.log('✓ Venta agregada: viernes 13 feb 2026, 10pm')
console.log('  7 hervidos = $49.000 | efectivo | guillermo')

db.close()
console.log('\nListo.')
