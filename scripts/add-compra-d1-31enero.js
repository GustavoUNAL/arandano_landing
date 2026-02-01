/**
 * Registra la compra del viernes 31 de enero 2026, 7pm, Tiendas D1.
 * 9 ítems en inventario + 1 gasto por el total.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-01-31'
const supplier = 'Tiendas D1'
const now = new Date().toISOString()

const items = [
  { name: 'Papel higiénico 3H', quantity: 1, unitPrice: 6700, total: 6700, category: 'desechables', unit: 'Paquete' },
  { name: 'Gaseosa Coca-Cola', quantity: 1, unitPrice: 6490, total: 6490, category: 'desechables', unit: 'Botella' },
  { name: 'Gaseosa Schweppes', quantity: 1, unitPrice: 4750, total: 4750, category: 'desechables', unit: 'Botella' },
  { name: 'Moritas de go', quantity: 1, unitPrice: 4600, total: 4600, category: 'acompañantes', unit: 'Unidad' },
  { name: 'Limpiador Bic', quantity: 1, unitPrice: 6750, total: 6750, category: 'productos de limpieza', unit: 'Unidad' },
  { name: 'Bolsa papelera', quantity: 2, unitPrice: 2200, total: 4400, category: 'desechables', unit: 'Unidad' },
  { name: 'Bolsa hogar', quantity: 1, unitPrice: 1900, total: 1900, category: 'desechables', unit: 'Unidad' },
  { name: 'Ambientador', quantity: 1, unitPrice: 5850, total: 5850, category: 'productos de limpieza', unit: 'Unidad' },
  { name: 'Lulo 800 g', quantity: 1, unitPrice: 5990, total: 5990, category: 'acompañantes', unit: 'Unidad' }
]

const totalCompra = items.reduce((sum, i) => sum + i.total, 0)

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Insertando 9 ítems en inventario...')
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
  console.log(`  ${idx + 1}. ${item.name} — $${item.total.toLocaleString('es-CO')}`)
})

console.log('\nInsertando gasto por total de la compra...')
const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  expenseId,
  `Compra Tiendas D1: ${items.map(i => i.name).join(', ')}`,
  totalCompra,
  purchaseDate,
  'supplies',
  'variable',
  `Viernes 31 enero 2026 7pm - Tiendas D1`,
  now
)
console.log(`  Gasto: $${totalCompra.toLocaleString('es-CO')} — supplies — ${purchaseDate}`)

console.log('\nTotal compra: $' + totalCompra.toLocaleString('es-CO'))
db.close()
console.log('Listo.')
