/**
 * Registra compra Lote Bodega Bavaria.
 * - POKER LTA 330 cc: 24 latas — $63.998 ($2.666,58/u)
 * - CLUB COLOMBIA LTA: 24 latas — $73.398 ($3.058,25/u)
 * - BUDWEISER LTA 269 cc: 24 latas — $56.001 ($2.333,38/u)
 * Total: $193.397. Pago efectivo, aporte Gustavo Arteaga.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-02-08'
const lotCode = 'BODEGA-BAVARIA-20260208'
const supplier = 'Bodega Bavaria'
const now = new Date().toISOString()

const items = [
  {
    name: 'Cerveza Poker LTA 330 cc',
    quantity: 24,
    unit: 'Lata',
    unitPrice: 2666.58,
    total: 63998,
    category: 'bebidas alcoholicas',
  },
  {
    name: 'Cerveza Club Colombia LTA',
    quantity: 24,
    unit: 'Lata',
    unitPrice: 3058.25,
    total: 73398,
    category: 'bebidas alcoholicas',
  },
  {
    name: 'Cerveza Budweiser LTA 269 cc',
    quantity: 24,
    unit: 'Lata',
    unitPrice: 2333.38,
    total: 56001,
    category: 'bebidas alcoholicas',
  },
]

const totalCompra = items.reduce((sum, i) => sum + i.total, 0) // 193397

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Lote Bodega Bavaria — Inventario\n')
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
    lotCode,
    supplier,
    `Compra ${purchaseDate} ${supplier}. Pago efectivo, aporte Gustavo Arteaga.`,
    now,
    now
  )
  console.log(`  ${idx + 1}. ${item.name}`)
  console.log(`     ${item.quantity} ${item.unit} — $${item.total.toLocaleString('es-CO')} ($${item.unitPrice.toLocaleString('es-CO')}/u)`)
})

console.log('\nGasto (expense)...')
const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  expenseId,
  `Compra Bodega Bavaria: Poker LTA 330cc, Club Colombia LTA, Budweiser LTA 269cc`,
  totalCompra,
  purchaseDate,
  'supplies',
  'variable',
  'Pago efectivo. Aporte Gustavo Arteaga. Lote Bodega Bavaria.',
  now
)
console.log(`  Total: $${totalCompra.toLocaleString('es-CO')} — supplies — ${purchaseDate}`)
console.log('  Notas: Pago efectivo. Aporte Gustavo Arteaga.')

db.close()
console.log('\nListo.')