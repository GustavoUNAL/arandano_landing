/**
 * Script para actualizar la receta de Café negro artesanal
 * agregando todos los tipos de café disponibles en el inventario
 */

const fs = require('fs')
const path = require('path')

const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json')
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

// Buscar todos los tipos de café en el inventario
const cafes = inventory.filter(item => {
  const name = (item.name || '').toLowerCase()
  const category = (item.category || '').toLowerCase()
  
  // Buscar por nombre que contenga "café" (excepto utensilios y contenedores)
  const isCafe = name.includes('café') || name.includes('cafe')
  const isUtensil = name.includes('mug') || name.includes('pocillo') || name.includes('colador') || 
                    name.includes('termo') || name.includes('cafetera') || name.includes('bolsa para colar')
  
  return isCafe && !isUtensil && category.includes('insumos para café')
})

console.log('\n☕ Cafés encontrados en el inventario:\n')
cafes.forEach(cafe => {
  console.log(`  - ${cafe.name}: ${cafe.quantity} ${cafe.unit} (ID: ${cafe.id})`)
})

// Ingredientes para la receta (todos los cafés disponibles)
const ingredients = cafes.map(cafe => ({
  productId: cafe.id,
  productName: cafe.name,
  quantity: 10, // 10gr por taza
  unit: 'gr' // Todos los cafés se miden en gr para la receta
}))

console.log(`\n📝 Total de ingredientes de café: ${ingredients.length}\n`)

// Datos para actualizar la receta
const updateData = {
  productId: 'cafe-negro',
  ingredients: ingredients
}

console.log('📋 Datos para actualizar la receta de "Café negro artesanal":')
console.log(JSON.stringify(updateData, null, 2))
console.log('')

// Guardar en archivo para referencia
const updatePath = path.join(__dirname, '..', 'data', 'cafe-negro-update.json')
fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 2))
console.log(`💾 Datos guardados en: ${updatePath}\n`)

console.log('💡 Para actualizar la receta en Firebase, ejecuta:')
console.log('   curl -X PUT http://localhost:3000/api/recipes/{RECIPE_ID} -H "Content-Type: application/json" -d @' + updatePath + '\n')
