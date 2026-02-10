/**
 * Corrige la fecha de ventas y compras del 8 feb para que aparezcan en "Hoy".
 * Actualiza a la fecha actual (cuando ejecutas el script) las ventas y gastos del 2026-02-08.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const today = new Date()
const todayStr = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' +
  String(today.getDate()).padStart(2, '0')

console.log('Fecha de hoy (local):', todayStr)
console.log('Actualizando registros con fecha 2026-02-08 a', todayStr, '\n')

// Ventas: date puede ser '2026-02-08' o '2026-02-08T...'
const salesResult = db.prepare("UPDATE sales SET date = ? WHERE date LIKE '2026-02-08%' OR date = '2026-02-08'").run(todayStr)
console.log('Ventas actualizadas:', salesResult.changes)

// Gastos
const expResult = db.prepare("UPDATE expenses SET date = ? WHERE date = '2026-02-08'").run(todayStr)
console.log('Gastos actualizados:', expResult.changes)

// Inventario (purchaseDate)
const invResult = db.prepare("UPDATE inventory SET purchaseDate = ? WHERE purchaseDate = '2026-02-08'").run(todayStr)
console.log('Ítems de inventario actualizados:', invResult.changes)

db.close()
console.log('\nListo. Esos registros aparecerán en "Hoy" en la vista.')