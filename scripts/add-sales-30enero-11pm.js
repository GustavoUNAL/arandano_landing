/**
 * Registra ventas del 30 de enero de 2026 a las 11pm
 *
 * 6 cervezas Poker      21.000  Nequi
 * 6 cervezas Heineken   21.000  Nequi
 * Media aguardiente Nariño  27.500  Nequi
 * Mitad Smirnoff tamarindo  35.000  Nequi
 * Hervido #1            7.000   efectivo
 * Hervido #2            7.000   efectivo
 * Hervido #3            7.000   efectivo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const date = '2026-01-30'
const hour = 23
const now = new Date().toISOString()

function insertSale(items, total, paymentMethod, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, paymentMethod || null, notes || null, now, now)
  return id
}

// Product IDs (desde SQLite)
const PID = {
  poker: 'cerveza-poker-330',
  heineken: 'cerveza-heineken',
  aguardienteNarino: 'prod-1768501043986-dzy4iyvgk',
  smirnoffBotella: 'vodka-smirnoff-botella',
  hervido: 'bebida-1767479537737-5pcmv20sn',
}

const sales = [
  {
    items: [{ productId: PID.poker, productName: 'Cerveza Poker 330cm3', quantity: 6, unitPrice: 3500, totalPrice: 21000 }],
    total: 21000,
    paymentMethod: 'nequi',
    notes: null,
  },
  {
    items: [{ productId: PID.heineken, productName: 'Cerveza Heineken', quantity: 6, unitPrice: 3500, totalPrice: 21000 }],
    total: 21000,
    paymentMethod: 'nequi',
    notes: null,
  },
  {
    items: [{ productId: PID.aguardienteNarino, productName: 'Aguardiente Nariño', quantity: 1, unitPrice: 27500, totalPrice: 27500 }],
    total: 27500,
    paymentMethod: 'nequi',
    notes: 'Media aguardiente Nariño',
  },
  {
    items: [{ productId: PID.smirnoffBotella, productName: 'Vodka Smirnoff tamarindo', quantity: 1, unitPrice: 35000, totalPrice: 35000 }],
    total: 35000,
    paymentMethod: 'nequi',
    notes: 'Mitad Smirnoff tamarindo',
  },
  {
    items: [{ productId: PID.hervido, productName: 'Hervido de fruta de temporada', quantity: 1, unitPrice: 7000, totalPrice: 7000 }],
    total: 7000,
    paymentMethod: 'efectivo',
    notes: 'Hervido #1',
  },
  {
    items: [{ productId: PID.hervido, productName: 'Hervido de fruta de temporada', quantity: 1, unitPrice: 7000, totalPrice: 7000 }],
    total: 7000,
    paymentMethod: 'efectivo',
    notes: 'Hervido #2',
  },
  {
    items: [{ productId: PID.hervido, productName: 'Hervido de fruta de temporada', quantity: 1, unitPrice: 7000, totalPrice: 7000 }],
    total: 7000,
    paymentMethod: 'efectivo',
    notes: 'Hervido #3',
  },
]

console.log('Registrando ventas del 30 ene 2026, 23:00 (11pm)\n')
sales.forEach((s, i) => {
  const id = insertSale(s.items, s.total, s.paymentMethod, s.notes)
  const desc = s.items.map(it => `${it.quantity}× ${it.productName}`).join(', ')
  console.log(`${i + 1}. ${id}`)
  console.log(`   ${desc} = $${s.total.toLocaleString('es-CO')} (${s.paymentMethod})${s.notes ? ' — ' + s.notes : ''}`)
})

db.close()
const totalDia = sales.reduce((sum, s) => sum + s.total, 0)
console.log('\nTotal del día (estas ventas): $' + totalDia.toLocaleString('es-CO'))
console.log('Listo.')
