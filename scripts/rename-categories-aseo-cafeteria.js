/**
 * Renombra categorías en inventario:
 * - productos de aseo -> aseo
 * - cafeteria -> insumos para cafeteria
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const r1 = db.prepare("UPDATE inventory SET category = 'aseo', updatedAt = ? WHERE category = 'productos de aseo'").run(now)
const r2 = db.prepare("UPDATE inventory SET category = 'insumos para cafeteria', updatedAt = ? WHERE category = 'cafeteria'").run(now)

console.log('productos de aseo -> aseo:', r1.changes, 'ítems')
console.log('cafeteria -> insumos para cafeteria:', r2.changes, 'ítems')

const cats = db.prepare('SELECT DISTINCT category FROM inventory ORDER BY category').all()
console.log('\nCategorías actuales:', cats.map(c => c.category).join(', '))

db.close()
console.log('\nListo.')
