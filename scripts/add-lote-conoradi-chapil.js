/**
 * Lote Conoradi - Chapil de los pastos
 * - 2 litros de Chapil por $36.000
 * - Compra: viernes 13 de febrero 2026, 5pm
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-02-13'
const lotCode = 'Conoradi'
const supplier = 'Conoradi'
const now = new Date().toISOString()

const items = [
  {
    name: 'Chapil de los pastos',
    quantity: 2,
    unit: 'Litro',
    unitPrice: 18000,
    total: 36000,
    category: 'insumos para cocteles',
    capacity: 2,
    capacityUnit: 'l',
  },
]

const totalCompra = items.reduce((sum, i) => sum + i.total, 0)

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Lote Conoradi — Chapil de los pastos — Inventario\n')
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
    `Compra viernes 13 de febrero 2026, 5pm. 2 L por $36.000.`,
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
  `Compra Chapil de los pastos - Lote Conoradi`,
  totalCompra,
  purchaseDate,
  'supplies',
  'variable',
  'Viernes 13 de febrero 2026, 5pm. 2 L por $36.000.',
  now
)
console.log(`  Total: $${totalCompra.toLocaleString('es-CO')} — supplies — ${purchaseDate}`)
console.log('  Notas: Viernes 13 de febrero 2026, 5pm.')

db.close()
console.log('\nListo.')
