/**
 * Agrega venta del viernes 13 feb 2026:
 * 10 hervidos = $70.000 (Nequi 60.000 + Efectivo 10.000)
 * Comentario: jose, blanca y george
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-02-13'
const hour = 14
const now = new Date().toISOString()

const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const items = [
  {
    productId: 'bebida-1767479537737-5pcmv20sn',
    productName: 'Hervido de fruta de temporada',
    quantity: 10,
    unitPrice: 7000,
    totalPrice: 70000,
  },
]

const tableInfo = db.prepare('PRAGMA table_info(sales)').all()
const hasMesa = tableInfo.some(col => col.name === 'mesa')

if (hasMesa) {
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, mesa, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), 70000, 'nequi', 'jose, blanca y george', null, now, now)
} else {
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), 70000, 'nequi', 'jose, blanca y george', now, now)
}

console.log('✓ Venta agregada: viernes 13 feb 2026')
console.log('  10 hervidos = $70.000')
console.log('  Nequi: 60.000 | Efectivo: 10.000')
console.log('  Comentario: jose, blanca y george')

db.close()
console.log('\nListo.')
