/**
 * Registra dos lotes de compra:
 *
 * Sábado 7 feb: 12.000 = 6 lulos, 2 tomates, albahaca
 * Domingo 8 feb: 12.000 = maracuyá, arándanos, menta
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const insertInv = db.prepare(`
  INSERT INTO inventory (
    id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit,
    unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

function addLot(purchaseDate, lotCode, supplier, items, expenseNote) {
  const totalCompra = items.reduce((sum, i) => sum + i.total, 0)
  console.log(`\n--- ${purchaseDate} ${supplier} (${lotCode}) ---`)
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
      `Compra ${purchaseDate} ${supplier}`,
      now,
      now
    )
    console.log(`  ${idx + 1}. ${item.name} — ${item.quantity} ${item.unit} — $${item.total.toLocaleString('es-CO')}`)
  })
  const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  db.prepare(`
    INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    expenseId,
    `Compra: ${items.map(i => i.name).join(', ')}`,
    totalCompra,
    purchaseDate,
    'supplies',
    'variable',
    expenseNote,
    now
  )
  console.log(`  Gasto: $${totalCompra.toLocaleString('es-CO')}`)
}

// --- Sábado 7 feb: 6 lulos, 2 tomates, albahaca = 12.000 ---
const lot7 = [
  { name: 'Lulo', quantity: 6, unit: 'Unidad', unitPrice: 1000, total: 6000, category: 'comestibles' },
  { name: 'Tomate', quantity: 2, unit: 'Unidad', unitPrice: 2000, total: 4000, category: 'comestibles' },
  { name: 'Albahaca', quantity: 1, unit: 'Unidad', unitPrice: 2000, total: 2000, category: 'comestibles' },
]
addLot('2026-02-07', 'COMPRA-20260207-001', 'Compras 7 feb', lot7, 'Sábado 7 feb — 6 lulos, 2 tomates, albahaca')

// --- Domingo 8 feb: maracuyá, arándanos, menta = 12.000 ---
const lot8 = [
  { name: 'Maracuyá', quantity: 1, unit: 'Unidad', unitPrice: 4000, total: 4000, category: 'comestibles' },
  { name: 'Arándanos', quantity: 1, unit: 'Unidad', unitPrice: 4000, total: 4000, category: 'comestibles' },
  { name: 'Menta', quantity: 1, unit: 'Unidad', unitPrice: 4000, total: 4000, category: 'comestibles' },
]
addLot('2026-02-08', 'COMPRA-20260208-001', 'Compras 8 feb', lot8, 'Domingo 8 feb — maracuyá, arándanos, menta')

db.close()
console.log('\nListo. 2 lotes agregados.')