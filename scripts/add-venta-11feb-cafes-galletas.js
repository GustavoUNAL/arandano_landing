/**
 * Registra venta del miércoles 11 feb 2026:
 * - 2 cafés + 2 galletas = $12.000 a las 3:00pm (15:00)
 * Cliente: el vecino 201 olimpo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-02-11'
const now = new Date().toISOString()

function insertSale(hour, items, total, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, notes || null, now, now)
  return id
}

// 2 cafés + 2 galletas = $12.000 a las 3:00pm
// Precios: 2 cafés × $4.000 = $8.000, 2 galletas × $2.000 = $4.000 (precio especial)
const sale1 = [
  {
    productId: 'cafe-negro',
    productName: 'Café negro artesanal',
    quantity: 2,
    unitPrice: 4000,
    totalPrice: 8000,
  },
  {
    productId: 'acompanante',
    productName: 'Acompañante del día (empanada o buñuelo)',
    quantity: 2,
    unitPrice: 2000,
    totalPrice: 4000,
  },
]
insertSale(15, sale1, 12000, 'el vecino 201 olimpo — 2 cafés + 2 galletas — 3:00pm')
console.log('✓ 2 cafés + 2 galletas = $12.000 — 3:00pm (hora 15)')
console.log('  Cliente: el vecino 201 olimpo')

db.close()
console.log('\nListo. Venta registrada para el 11 feb 2026.')
