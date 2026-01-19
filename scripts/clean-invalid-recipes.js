/**
 * Script para limpiar recetas que no deberían existir
 * Solo productos compuestos (coctel, cafe-caliente, cafe-frio) deben tener receta
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Buscar recetas que no deberían existir
const invalidRecipes = db.prepare(`
  SELECT r.id, r.productId, r.productName, r.category as recipe_category,
         p.name as product_name, p.category as product_category, p.type
  FROM recipes r
  LEFT JOIN products p ON r.productId = p.id
  WHERE p.category NOT IN ('coctel', 'cafe-caliente', 'cafe-frio')
     OR p.id IS NULL
     OR (p.category != r.category)
`).all()

console.log('\n🧹 Limpiando recetas inválidas...\n')

if (invalidRecipes.length === 0) {
  console.log('✅ No hay recetas inválidas. Todas las recetas son válidas.\n')
  db.close()
  process.exit(0)
}

console.log(`⚠️  Se encontraron ${invalidRecipes.length} receta(s) inválida(s):\n`)
invalidRecipes.forEach(recipe => {
  console.log(`   - ${recipe.productName || 'Producto no encontrado'} (ID: ${recipe.productId})`)
  console.log(`     Categoría del producto: ${recipe.product_category || 'N/A'}`)
  console.log(`     Categoría de la receta: ${recipe.recipe_category}`)
  console.log(`     Tipo: ${recipe.type || 'N/A'}`)
  console.log('')
})

// Eliminar recetas inválidas
const deleteRecipe = db.prepare('DELETE FROM recipes WHERE id = ?')
const deleteMany = db.transaction((recipes) => {
  for (const recipe of recipes) {
    deleteRecipe.run(recipe.id)
  }
})

deleteMany(invalidRecipes)

console.log(`✅ ${invalidRecipes.length} receta(s) eliminada(s)\n`)

// Verificar recetas duplicadas (mismo productId)
const duplicates = db.prepare(`
  SELECT productId, COUNT(*) as count
  FROM recipes
  GROUP BY productId
  HAVING COUNT(*) > 1
`).all()

if (duplicates.length > 0) {
  console.log(`⚠️  Se encontraron ${duplicates.length} producto(s) con recetas duplicadas:\n`)
  
  for (const dup of duplicates) {
    const recipeList = db.prepare(`
      SELECT id, createdAt, updatedAt
      FROM recipes
      WHERE productId = ?
      ORDER BY updatedAt DESC, createdAt DESC
    `).all(dup.productId)
    
    console.log(`   Producto: ${dup.productId} (${dup.count} recetas)`)
    // Mantener solo la más reciente, eliminar las demás
    const toKeep = recipeList[0]
    const toDelete = recipeList.slice(1)
    
    for (const recipe of toDelete) {
      deleteRecipe.run(recipe.id)
      console.log(`     ❌ Eliminada receta duplicada: ${recipe.id}`)
    }
    console.log(`     ✅ Mantenida receta: ${toKeep.id}\n`)
  }
}

db.close()
console.log('✅ Limpieza completada\n')
