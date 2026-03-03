/**
 * Agrega al sistema de cobros (productos):
 * - Botella aguardiente amarillo: $70.000
 * - Botella de aguardiente Nariño: $70.000
 * - Botella de Smirnoff de tamarindo: $70.000
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const productos = [
  { name: 'Botella aguardiente amarillo', price: 70000, category: 'aguardiente', type: 'bebida', size: '750 ml' },
  { name: 'Botella de aguardiente Nariño', price: 70000, category: 'aguardiente', type: 'bebida', size: '750 ml' },
  { name: 'Botella de Smirnoff de tamarindo', price: 70000, category: 'vodka', type: 'bebida', size: '750 ml' },
]

const tableInfo = db.prepare('PRAGMA table_info(products)').all()
const hasOptionalCols = tableInfo.some(c => c.name === 'minStock')

const insertSQL = hasOptionalCols
  ? `INSERT INTO products (id, name, price, description, category, type, stock, imageUrl, size, minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  : `INSERT INTO products (id, name, price, description, category, type, stock, size, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

const stmt = db.prepare(insertSQL)

for (const p of productos) {
  const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  if (hasOptionalCols) {
    stmt.run(id, p.name, p.price, null, p.category, p.type, 999, null, p.size, null, null, null, null, null, null, 0, now, now)
  } else {
    stmt.run(id, p.name, p.price, null, p.category, p.type, 999, p.size, now, now)
  }
  console.log('✓', p.name, '-', p.price)
}

db.close()
console.log('\nListo. 3 productos agregados al sistema de cobros.')
