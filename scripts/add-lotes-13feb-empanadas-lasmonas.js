/**
 * Lotes 13 de febrero 2026
 * 1. Empanadas - 6 empanadas $26.100 — compra en el parqueadero
 * 2. Canela, anís y pulpas - $34.000 — tienda Las Monas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const purchaseDate = '2026-02-13'
const now = new Date().toISOString()

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertExpense = db.prepare(`
  INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

// --- Compra 1: Empanadas (parqueadero) ---
const empanadas = [
  {
    name: 'Empanadas',
    quantity: 6,
    unit: 'Unidad',
    unitPrice: 4350,
    total: 26100,
    category: 'acompañantes',
  },
]
const lotEmpanadas = 'Parqueadero'
const supplierEmpanadas = 'Parqueadero'

console.log('Lote Parqueadero — Empanadas — Inventario\n')
empanadas.forEach((item, idx) => {
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
    lotEmpanadas,
    supplierEmpanadas,
    'Compra 13 feb 2026 en el parqueadero. 6 empanadas.',
    now,
    now
  )
  console.log(`  ${idx + 1}. ${item.name} — ${item.quantity} ${item.unit} — $${item.total.toLocaleString('es-CO')}`)
})

const totalEmpanadas = empanadas.reduce((s, i) => s + i.total, 0)
insertExpense.run(
  `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  'Compra Empanadas - Parqueadero',
  totalEmpanadas,
  purchaseDate,
  'supplies',
  'variable',
  '13 feb 2026. Compra en el parqueadero. 6 empanadas.',
  now
)
console.log(`  Gasto: $${totalEmpanadas.toLocaleString('es-CO')}\n`)

// --- Compra 2: Canela, anís y pulpas (Las Monas) ---
const lasMonas = [
  {
    name: 'Canela, anís y pulpas',
    quantity: 1,
    unit: 'Compra',
    unitPrice: 34000,
    total: 34000,
    category: 'insumos para cocteles',
  },
]
const lotMonas = 'Las Monas'
const supplierMonas = 'Tienda Las Monas'

console.log('Lote Las Monas — Canela, anís y pulpas — Inventario\n')
lasMonas.forEach((item, idx) => {
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
    lotMonas,
    supplierMonas,
    'Compra 13 feb 2026 en tienda Las Monas.',
    now,
    now
  )
  console.log(`  ${idx + 1}. ${item.name} — $${item.total.toLocaleString('es-CO')}`)
})

const totalMonas = lasMonas.reduce((s, i) => s + i.total, 0)
insertExpense.run(
  `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  'Compra Canela, anís y pulpas - Las Monas',
  totalMonas,
  purchaseDate,
  'supplies',
  'variable',
  '13 feb 2026. Tienda Las Monas.',
  now
)
console.log(`  Gasto: $${totalMonas.toLocaleString('es-CO')}\n`)

db.close()
console.log('Listo.')
console.log(`Total empanadas: $${totalEmpanadas.toLocaleString('es-CO')} | Total Las Monas: $${totalMonas.toLocaleString('es-CO')}`)
