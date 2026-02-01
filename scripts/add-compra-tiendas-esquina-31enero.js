/**
 * Registra la compra del viernes 31 de enero 2026, 8pm, Tiendas esquina.
 * Azúcar morena 1500 g + anís estrellado = 10.000 COP
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-01-31'
const supplier = 'Tiendas esquina'
const now = new Date().toISOString()

// Reparto del total: azúcar 5.000, anís 5.000
const items = [
  { name: 'Azúcar morena', quantity: 1.5, unit: 'kg', unitPrice: 3333, total: 5000, category: 'cafeteria' },
  { name: 'Anís estrellado', quantity: 1, unit: 'Unidad', unitPrice: 5000, total: 5000, category: 'cafeteria' }
]

const totalCompra = 10000

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Insertando 2 ítems en inventario...')
items.forEach((item, idx) => {
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  insertInv.run(
    id,
    item.name,
    item.category,
    item.quantity,
    item.quantity,
    item.unit,
    null, null, null, null, null, null, null,
    item.unitPrice,
    item.total,
    null,
    purchaseDate,
    null,
    supplier,
    `Compra ${purchaseDate} ${supplier}`,
    now,
    now
  )
  console.log(`  ${idx + 1}. ${item.name} ${item.quantity} ${item.unit} — $${item.total.toLocaleString('es-CO')}`)
})

const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  expenseId,
  'Compra Tiendas esquina: Azúcar morena 1500 g, anís estrellado',
  totalCompra,
  purchaseDate,
  'supplies',
  'variable',
  'Viernes 31 enero 2026 8pm - Tiendas esquina',
  now
)
console.log('\nGasto: $' + totalCompra.toLocaleString('es-CO') + ' — supplies — ' + purchaseDate)
db.close()
console.log('Listo.')
