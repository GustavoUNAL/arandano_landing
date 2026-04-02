/**
 * Sincroniza data/products.json hacia la base SQLite (data/arandano.db).
 * Actualiza nombre, precio, descripción y demás campos por id.
 * Uso: node scripts/sync-products-json-to-db.js
 */

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const productsPath = path.join(__dirname, '..', 'data', 'products.json')

if (!fs.existsSync(productsPath)) {
  console.log('No existe data/products.json')
  process.exit(1)
}
if (!fs.existsSync(dbPath)) {
  console.log('No existe data/arandano.db. Ejecuta la app una vez para crearla o usa npm run migrate:sqlite')
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
const now = new Date().toISOString()

const insert = db.prepare(`
  INSERT INTO products (
    id, name, price, description, category, type, stock, imageUrl, size,
    minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    price = excluded.price,
    description = excluded.description,
    category = excluded.category,
    type = excluded.type,
    stock = excluded.stock,
    imageUrl = excluded.imageUrl,
    size = excluded.size,
    updatedAt = excluded.updatedAt
`)

const run = db.transaction((items) => {
  const ids = items.map((p) => /** @type {string} */ (p.id))
  const placeholders = ids.map(() => '?').join(',')
  // Eliminar primero huérfanos para no violar UNIQUE(name, size) al renombrar/reemplazar.
  db.prepare(`DELETE FROM recipes WHERE productId NOT IN (${placeholders})`).run(...ids)
  db.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders})`).run(...ids)
  for (const p of items) {
    const name = (p.name || '').toString().trim()
    const desc =
      p.description != null && String(p.description).trim() !== ''
        ? String(p.description).trim()
        : ''
    insert.run(
      p.id,
      name,
      Number(p.price) || 0,
      desc,
      (p.category || 'otros').toString().trim(),
      (p.type || 'bebida').toString().trim(),
      Number(p.stock) ?? 0,
      p.imageUrl || null,
      (p.size != null ? String(p.size) : '').trim(),
      p.minStock != null ? Number(p.minStock) : null,
      p.cost != null ? Number(p.cost) : null,
      p.purchaseDate || null,
      p.lot || null,
      p.supplier || null,
      p.lastSaleDate || null,
      Number(p.totalSold) || 0,
      now,
      now
    )
  }
})

run(products)
db.close()
console.log('OK: ' + products.length + ' productos sincronizados desde data/products.json a SQLite.')
