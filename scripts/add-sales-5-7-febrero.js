/**
 * Registra ventas del 5, 6 y 7 de febrero de 2026
 *
 * Jueves 5: 1 hervido + 1 acompañante = $10.000
 * Viernes 6: Hervido+bizcocho $8.000; Mauricio 6 hervidos+2 cervezas $49.000;
 *            Sr. 505: 4 hervidos+2 cóctel chapil+3 cigarrillos $45.000; Don Iván 6 cervezas $17.500. Total $119.500
 * Sábado 7: Mauricio 3 cervezas $10.500 + 5 hervidos $35.000 = $45.500
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const PID = {
  hervido: 'bebida-1767479537737-5pcmv20sn',
  hervidoName: 'Hervido de fruta de temporada',
  acompanante: 'acompanante',
  acompananteName: 'Acompañante del día (Empanada, Buñuelo)',
  pastel: 'pastel-dia',
  pastelName: 'Pastel del día',
  cerveza: 'cerveza-poker-330',
  cervezaName: 'Cerveza Poker 330cm3',
  coctelChapil: 'bebida-1767478306369-c8s8nr6nh',
  coctelChapilName: 'Cóctel Chapil',
  cigarrillo: 'prod-1768843715583-n44rw1kv2',
  cigarrilloName: 'Cigarrillo',
}

function insertSale(date, hour, items, total, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, hour, JSON.stringify(items), total, null, notes || null, now, now)
  return id
}

// --- Jueves 5 de febrero: 1 hervido + 1 acompañante = $10.000 ---
const jueves5 = [
  {
    productId: PID.hervido,
    productName: PID.hervidoName,
    quantity: 1,
    unitPrice: 7000,
    totalPrice: 7000,
  },
  {
    productId: PID.acompanante,
    productName: PID.acompananteName,
    quantity: 1,
    unitPrice: 3000,
    totalPrice: 3000,
  },
]
insertSale('2026-02-05', 12, jueves5, 10000, 'Jueves 5 feb')
console.log('Jueves 5 feb: 1 hervido + 1 acompañante = $10.000')

// --- Viernes 6 de febrero ---
// 1. Hervido + bizcocho → $8.000
const v1 = [
  { productId: PID.hervido, productName: PID.hervidoName, quantity: 1, unitPrice: 5000, totalPrice: 5000 },
  { productId: PID.pastel, productName: PID.pastelName, quantity: 1, unitPrice: 3000, totalPrice: 3000 },
]
insertSale('2026-02-06', 12, v1, 8000, 'Hervido + bizcocho')
console.log('Viernes 6 feb: Hervido + bizcocho = $8.000')

// 2. Mauricio: 6 hervidos + 2 cervezas → $49.000
const v2 = [
  { productId: PID.hervido, productName: PID.hervidoName, quantity: 6, unitPrice: 7000, totalPrice: 42000 },
  { productId: PID.cerveza, productName: PID.cervezaName, quantity: 2, unitPrice: 3500, totalPrice: 7000 },
]
insertSale('2026-02-06', 14, v2, 49000, 'Mauricio')
console.log('Viernes 6 feb: Mauricio 6 hervidos + 2 cervezas = $49.000')

// 3. Sr. edificio 505: 4 hervidos + 2 cóctel chapil + 3 cigarrillos → $45.000
const v3 = [
  { productId: PID.hervido, productName: PID.hervidoName, quantity: 4, unitPrice: 7000, totalPrice: 28000 },
  { productId: PID.coctelChapil, productName: PID.coctelChapilName, quantity: 2, unitPrice: 7000, totalPrice: 14000 },
  { productId: PID.cigarrillo, productName: PID.cigarrilloName, quantity: 3, unitPrice: 1000, totalPrice: 3000 },
]
insertSale('2026-02-06', 15, v3, 45000, 'Sr. edificio 505')
console.log('Viernes 6 feb: Sr. 505 → 4 hervidos + 2 cóctel chapil + 3 cigarrillos = $45.000')

// 4. Don Iván: 6 cervezas → $17.500
const v4 = [
  { productId: PID.cerveza, productName: PID.cervezaName, quantity: 6, unitPrice: 2916, totalPrice: 17496 },
]
insertSale('2026-02-06', 16, v4, 17500, 'Don Iván - 6 cervezas')
console.log('Viernes 6 feb: Don Iván 6 cervezas = $17.500')

// --- Sábado 7 de febrero: Mauricio 3 cervezas $10.500 + 5 hervidos $35.000 = $45.500 ---
const sabado7 = [
  { productId: PID.cerveza, productName: PID.cervezaName, quantity: 3, unitPrice: 3500, totalPrice: 10500 },
  { productId: PID.hervido, productName: PID.hervidoName, quantity: 5, unitPrice: 7000, totalPrice: 35000 },
]
insertSale('2026-02-07', 14, sabado7, 45500, 'Mauricio')
console.log('Sábado 7 feb: Mauricio 3 cervezas + 5 hervidos = $45.500')

db.close()

const totalJueves = 10000
const totalViernes = 8000 + 49000 + 45000 + 17500
const totalSabado = 45500
console.log('\nResumen:')
console.log('  Jueves 5 feb:  $' + totalJueves.toLocaleString('es-CO'))
console.log('  Viernes 6 feb: $' + totalViernes.toLocaleString('es-CO') + ' (4 ventas)')
console.log('  Sábado 7 feb:  $' + totalSabado.toLocaleString('es-CO'))
console.log('  Total:        $' + (totalJueves + totalViernes + totalSabado).toLocaleString('es-CO'))
console.log('Listo.')