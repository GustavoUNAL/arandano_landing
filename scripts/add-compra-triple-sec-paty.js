/**
 * Registra compra de Triple Sec - Lote Paty
 * - Triple sec: 1 litro — $33.400
 * Fecha: 12 de febrero 2026, 8pm
 * Nota: lo pagó gustavo
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-02-12'
const lotCode = 'Paty'
const supplier = 'Paty'
const now = new Date().toISOString()

const items = [
  {
    name: 'Triple sec',
    quantity: 1,
    unit: 'Litro',
    unitPrice: 33400,
    total: 33400,
    category: 'insumos para cocteles',
    capacity: 1,
    capacityUnit: 'l',
  },
]

const totalCompra = items.reduce((sum, i) => sum + i.total, 0) // 33400

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Lote Paty — Triple Sec — Inventario\n')
items.forEach((item, idx) => {
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  insertInv.run(
    id,
    item.name,
    item.category,
    item.quantity,
    item.quantity,
    item.unit,
    item.capacity || null,
    item.capacityUnit || null,
    item.capacity || null,
    item.capacityUnit || null,
    null, null, null,
    item.unitPrice,
    item.total,
    null,
    purchaseDate,
    lotCode,
    supplier,
    `Compra ${purchaseDate} ${supplier}. Lo pagó gustavo.`,
    now,
    now
  )
  console.log(`  ${idx + 1}. ${item.name}`)
  console.log(`     ${item.quantity} ${item.unit} (${item.capacity}${item.capacityUnit}) — $${item.total.toLocaleString('es-CO')} ($${item.unitPrice.toLocaleString('es-CO')}/u)`)
})

console.log('\nGasto (expense)...')
const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  expenseId,
  `Compra Triple sec - Lote Paty`,
  totalCompra,
  purchaseDate,
  'supplies',
  'variable',
  'Lo pagó gustavo. Lote Paty.',
  now
)
console.log(`  Total: $${totalCompra.toLocaleString('es-CO')} — supplies — ${purchaseDate}`)
console.log('  Notas: Lo pagó gustavo. Lote Paty.')

db.close()
console.log('\nListo.')
