/**
 * Agrega compra como activo del local - Jueves 29 enero 2026, 3pm, Almacenes Éxito Pasto:
 * - TV Samsung 40" = 957.000
 * - Base para el TV = 100.000
 * - Seguro del TV = 70.000
 * Total: 1.127.000
 *
 * Registra 3 ítems en inventario (categoría activos) y 1 gasto con el total.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-01-29'
const supplier = 'Almacenes Éxito Pasto'
const lot = 'EXITO-20260129-TV'
const now = new Date().toISOString()

const activos = [
  { name: 'TV Samsung 40"', unitPrice: 957000, totalValue: 957000 },
  { name: 'Base para el TV', unitPrice: 100000, totalValue: 100000 },
  { name: 'Seguro del TV', unitPrice: 70000, totalValue: 70000 }
]

// 1. Insertar 3 ítems en inventario (activos)
console.log('Agregando activos al inventario...\n')
for (const item of activos) {
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO inventory (
      id, name, category, quantity, initialQuantity, unit, unitPrice, totalValue,
      purchaseDate, lot, supplier, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    item.name,
    'activos',
    1,
    1,
    'Unidad',
    item.unitPrice,
    item.totalValue,
    purchaseDate,
    lot,
    supplier,
    now,
    now
  )
  console.log('  ✓', item.name, '-', '$' + item.unitPrice.toLocaleString('es-CO'))
}

// 2. Registrar el gasto (compra total)
const totalCompra = 957000 + 100000 + 70000
const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  expenseId,
  'TV Samsung 40", base y seguro - Activo local',
  totalCompra,
  purchaseDate,
  'other',
  'variable',
  `Compra jueves 29 ene 2026 3pm - ${supplier}`,
  now
)

console.log('\nGasto registrado:')
console.log('  ID:', expenseId)
console.log('  Descripción: TV Samsung 40", base y seguro - Activo local')
console.log('  Total: $' + totalCompra.toLocaleString('es-CO'))
console.log('  Fecha:', purchaseDate, '|', supplier)

db.close()
console.log('\nListo.')
