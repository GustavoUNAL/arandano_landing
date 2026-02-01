/**
 * Agrega venta: 1 café + 1 porción + 1 acompañante del día = $7.500
 * 30 ene 2026, 5pm (17:00), efectivo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const now = new Date().toISOString()

const items = [
  { productId: 'cafe-negro', productName: 'Café negro artesanal', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
  { productId: 'pastel-dia', productName: 'Pastel del día (porción)', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
  { productId: 'acompanante', productName: 'Acompañante del día (Empanada, Buñuelo)', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
]

db.prepare(`
  INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(id, '2026-01-30', 17, JSON.stringify(items), 7500, 'efectivo', null, now, now)

console.log('Venta agregada:')
console.log('  ID:', id)
console.log('  Fecha: 2026-01-30, Hora: 17:00 (5pm)')
console.log('  1 Café + 1 Porción (pastel) + 1 Acompañante del día = $7.500 ($2.500 c/u en combo)')
console.log('  Medio de pago: efectivo')

db.close()
