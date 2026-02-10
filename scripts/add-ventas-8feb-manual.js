/**
 * Registra manualmente 2 ventas del 8 feb 2026:
 * - 3 cafés = $9.000 a las 5pm (17:00)
 * - 12 cervezas Poker a $3.500 = $42.000 a las 7:46pm (hora 19)
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-02-08'
const now = new Date().toISOString()

function insertSale(hour, items, total, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, notes || null, now, now)
  return id
}

// 1. 3 cafés = $9.000 a las 5pm
const sale1 = [
  {
    productId: 'cafe-negro',
    productName: 'Café negro artesanal',
    quantity: 3,
    unitPrice: 3000,
    totalPrice: 9000,
  },
]
insertSale(17, sale1, 9000, '3 cafés — 5pm')
console.log('1. 3 cafés = $9.000 — 5pm (hora 17)')

// 2. 12 cervezas Poker $3.500 c/u = $42.000 a las 7:46pm
const sale2 = [
  {
    productId: 'cerveza-poker-330',
    productName: 'Cerveza Poker 330cm3',
    quantity: 12,
    unitPrice: 3500,
    totalPrice: 42000,
  },
]
insertSale(19, sale2, 42000, '12 cervezas Poker — 7:46pm')
console.log('2. 12 cervezas Poker = $42.000 — 7:46pm (hora 19)')

db.close()
console.log('\nListo. 2 ventas registradas para el 8 feb 2026.')