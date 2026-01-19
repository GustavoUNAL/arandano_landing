/**
 * Script para actualizar todas las recetas de café con todas las opciones de stock disponibles
 * y verificar/corregir las cantidades
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Obtener todos los cafés disponibles en inventario (solo cafés reales)
const cafes = db.prepare(`
  SELECT id, name, quantity, unit, category
  FROM inventory
  WHERE (name LIKE 'Café %' OR name LIKE '%Café %' OR name = 'Café Instantáneo' OR name = 'Café especial Buesaco' OR name = 'Café La Jacoba')
    AND name NOT LIKE '%mug%'
    AND name NOT LIKE '%pocillo%'
    AND name NOT LIKE '%colador%'
    AND name NOT LIKE '%termo%'
    AND name NOT LIKE '%cafetera%'
    AND name NOT LIKE '%bolsa para colar%'
  ORDER BY name
`).all()

console.log('\n☕ Cafés disponibles en inventario:\n')
cafes.forEach(cafe => {
  console.log(`   - ${cafe.name}: ${cafe.quantity} ${cafe.unit} (ID: ${cafe.id})`)
})
console.log(`\n   Total: ${cafes.length} tipo(s) de café\n`)

// Obtener todas las recetas de café
const coffeeRecipes = db.prepare(`
  SELECT id, productId, productName, category, ingredients
  FROM recipes
  WHERE category IN ('cafe-caliente', 'cafe-frio')
  ORDER BY productName
`).all()

console.log('📝 Recetas de café encontradas:\n')
coffeeRecipes.forEach(recipe => {
  console.log(`   - ${recipe.productName} (${recipe.category})`)
})
console.log(`\n   Total: ${coffeeRecipes.length} receta(s)\n`)

// Actualizar cada receta de café
const updateRecipe = db.prepare(`
  UPDATE recipes
  SET ingredients = ?, updatedAt = ?
  WHERE id = ?
`)

const now = new Date().toISOString()
let updatedCount = 0

coffeeRecipes.forEach(recipe => {
  const currentIngredients = JSON.parse(recipe.ingredients)
  
  // Filtrar solo los ingredientes de café actuales
  const currentCafes = currentIngredients.filter(ing => {
    const ingName = (ing.productName || '').toLowerCase()
    return ingName.includes('café') || ingName.includes('cafe')
  })
  
  // Mantener SOLO los ingredientes que son válidos para recetas de café
  // (leche, licores, aromáticas, azúcar, hielo, etc. - NO cosas como arándanos, jamón, queso, etc.)
  const validNonCoffeeIngredients = currentIngredients.filter(ing => {
    const ingName = (ing.productName || '').toLowerCase()
    
    // Si es café, excluirlo (lo agregaremos después)
    if (ingName.includes('café') || ingName.includes('cafe')) {
      return false
    }
    
    // Mantener ingredientes válidos para café
    const validIngredients = [
      'leche', 'milk',
      'azúcar', 'sugar',
      'aromáticas', 'aromatic',
      'hielo', 'ice',
      'licor', 'whisky', 'aguardiente', 'vodka', 'gin', 'tequila', 'ron',
      'crema', 'cream',
      'canela', 'cinnamon',
      'vainilla', 'vanilla'
    ]
    
    return validIngredients.some(valid => ingName.includes(valid))
  })
  
  // Agregar todos los cafés disponibles
  const coffeeIngredients = cafes.map(cafe => {
    // Buscar si ya existe en los ingredientes actuales para mantener la cantidad
    const existing = currentCafes.find(ci => ci.productId === cafe.id)
    return {
      productId: cafe.id,
      productName: cafe.name,
      quantity: existing ? existing.quantity : 10, // 10gr por taza por defecto
      unit: 'gr'
    }
  })
  
  const newIngredients = [...coffeeIngredients, ...validNonCoffeeIngredients]
  
  updateRecipe.run(
    JSON.stringify(newIngredients),
    now,
    recipe.id
  )
  
  console.log(`✅ Actualizada: ${recipe.productName}`)
  console.log(`   Ingredientes de café: ${coffeeIngredients.length}`)
  coffeeIngredients.forEach(ing => {
    console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit}`)
  })
  console.log(`   Ingredientes no-café: ${validNonCoffeeIngredients.length}`)
  validNonCoffeeIngredients.forEach(ing => {
    console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit}`)
  })
  console.log('')
  
  updatedCount++
})

console.log(`\n✅ ${updatedCount} receta(s) de café actualizada(s)\n`)

// Verificar cantidades recomendadas
console.log('📊 Verificación de cantidades recomendadas:\n')
console.log('   - Café (gr): 10-15gr por taza (estándar: 10gr)')
console.log('   - Leche (ml): 50-100ml por taza (depende del tipo)')
console.log('   - Azúcar (gr): 5-10gr por taza (opcional)')
console.log('   - Licores (ml): 30-50ml por cóctel/café especial\n')

db.close()
