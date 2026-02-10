/**
 * Sincroniza recetas con los productos actuales: actualiza productName en cada receta
 * para que coincida con el nombre actual del producto en la tabla products.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const recipes = db.prepare('SELECT id, productId, productName FROM recipes').all()
const getProductName = db.prepare('SELECT name FROM products WHERE id = ?')
const updateRecipe = db.prepare('UPDATE recipes SET productName = ?, updatedAt = ? WHERE id = ?')

console.log('Actualizando recetas con nombres de productos actuales...\n')

let updated = 0
for (const rec of recipes) {
  const row = getProductName.get(rec.productId)
  if (!row) {
    console.log('  [SKIP] Producto no encontrado:', rec.productId)
    continue
  }
  const newName = row.name
  if (rec.productName !== newName) {
    updateRecipe.run(newName, now, rec.id)
    console.log('  ✓', rec.productId)
    console.log('    Antes:', rec.productName)
    console.log('    Ahora:', newName)
    updated++
  }
}

console.log('\nRecetas actualizadas:', updated, 'de', recipes.length)
db.close()
console.log('Listo.')
