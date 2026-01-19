/**
 * Script para crear recetas básicas para todos los productos que las necesitan
 * (cócteles y cafés)
 */

const fs = require('fs')
const path = require('path')

// Cargar productos e inventario
const productsPath = path.join(__dirname, '..', 'data', 'products.json')
const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json')

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

// Normalizar nombre para búsqueda
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Buscar ingrediente en inventario por nombre (normalizado)
function findIngredientInInventory(searchName) {
  const normalized = normalizeName(searchName)
  return inventory.find(item => {
    const itemName = normalizeName(item.name || '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

// Definir recetas básicas para cada tipo de producto
// Usar ingredientes que existen realmente en el inventario
const recipeTemplates = {
  // Recetas para cafés calientes
  'cafe-negro': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' }
      // Nota: Agua no está en inventario - se asume disponible
    ]
  },
  'cafe-leche': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Leche Alquería', quantity: 50, unit: 'ml' }
    ]
  },
  'cafe-aromatizado': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Aromáticas', quantity: 1, unit: 'unidad' }
    ]
  },
  'cafe-irlandes': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Whisky Duggan', quantity: 30, unit: 'ml' },
      { name: 'Leche Alquería', quantity: 30, unit: 'ml' }
    ]
  },
  'carajillo': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Aguardiente', quantity: 30, unit: 'ml' }
    ]
  },
  'vaso-leche': {
    ingredients: [
      { name: 'Leche Alquería', quantity: 250, unit: 'ml' }
    ]
  },
  'cafe-frio': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Hielo bolsa', quantity: 100, unit: 'gr' }
    ]
  },
  'cafe-helado': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Hielo bolsa', quantity: 150, unit: 'gr' }
    ]
  },
  'cafe-frio-leche': {
    ingredients: [
      { name: 'Café Sello Rojo', quantity: 10, unit: 'gr' },
      { name: 'Leche Alquería', quantity: 50, unit: 'ml' },
      { name: 'Hielo bolsa', quantity: 100, unit: 'gr' }
    ]
  },
  // Recetas para cócteles
  'coctel-arandano': {
    ingredients: [
      { name: 'Sirope arándanos', quantity: 30, unit: 'ml' },
      { name: 'Bretaña', quantity: 200, unit: 'ml' }
    ]
  },
  'vino-caliente': {
    ingredients: [
      { name: 'Vino Tinto', quantity: 150, unit: 'ml' },
      { name: 'Azúcar', quantity: 10, unit: 'gr' }
    ]
  },
  'bebida-1767478306369-c8s8nr6nh': { // moscowmule
    ingredients: [
      { name: 'Vodka Moskovskaya', quantity: 45, unit: 'ml' },
      { name: 'Bretaña', quantity: 120, unit: 'ml' },
      { name: 'Hielo bolsa', quantity: 100, unit: 'gr' }
    ]
  },
  'bebida-1767478463497-c2aya0ta0': { // campari
    ingredients: [
      { name: 'Campari', quantity: 50, unit: 'ml' },
      { name: 'Bretaña', quantity: 150, unit: 'ml' },
      { name: 'Hielo bolsa', quantity: 100, unit: 'gr' }
    ]
  },
  'bebida-1767479422734-8ofoa07j2': { // soda sin licor
    ingredients: [
      { name: 'Bretaña', quantity: 200, unit: 'ml' },
      { name: 'Hielo bolsa', quantity: 100, unit: 'gr' }
    ]
  },
  'bebida-1767479537737-5pcmv20sn': { // hervido de fruta
    ingredients: [
      { name: 'Base cóctel Brissart', quantity: 50, unit: 'ml' },
      { name: 'Bretaña', quantity: 150, unit: 'ml' }
    ]
  },
  'bebida-1767479680271-wp5qa9j7m': { // margaritas
    ingredients: [
      { name: 'Tequila', quantity: 45, unit: 'ml' },
      { name: 'Base cóctel Finest Call Triple Sec', quantity: 20, unit: 'ml' }
    ]
  },
  'prod-1768498200781-amarillo': { // aguardiente amarillo
    ingredients: [
      { name: 'Aguardiente Nariño', quantity: 60, unit: 'ml' },
      { name: 'Bretaña', quantity: 140, unit: 'ml' }
    ]
  },
  'prod-1768498200787-narino': { // aguardiente nariño (shot)
    ingredients: [
      { name: 'Aguardiente Nariño', quantity: 60, unit: 'ml' }
    ]
  }
}

// Función para crear una receta con ingredientes encontrados en inventario
function createRecipeForProduct(product) {
  const recipeTemplate = recipeTemplates[product.id]
  
  if (!recipeTemplate) {
    console.log(`⚠️  No hay plantilla de receta para: ${product.name} (${product.id})`)
    return null
  }

  const ingredients = []
  
  for (const templateIngredient of recipeTemplate.ingredients) {
    const inventoryItem = findIngredientInInventory(templateIngredient.name)
    
    if (inventoryItem) {
      // Mapear unidad del inventario a unidad de receta
      let unit = templateIngredient.unit
      if (inventoryItem.unit && inventoryItem.unit.toLowerCase() !== unit) {
        // Normalizar unidades
        const invUnit = inventoryItem.unit.toLowerCase()
        if (invUnit.includes('litro') || invUnit === 'l') {
          if (unit === 'ml') unit = 'ml'
        } else if (invUnit.includes('ml')) {
          unit = 'ml'
        } else if (invUnit.includes('gram') || invUnit === 'gr' || invUnit === 'g') {
          unit = 'gr'
        } else if (invUnit.includes('unidad') || invUnit.includes('pz') || invUnit.includes('pieza')) {
          unit = 'unidad'
        }
      }
      
      ingredients.push({
        productId: inventoryItem.id,
        productName: inventoryItem.name,
        quantity: templateIngredient.quantity,
        unit: unit
      })
    } else {
      console.log(`  ⚠️  Ingrediente no encontrado en inventario: ${templateIngredient.name} para ${product.name}`)
    }
  }

  if (ingredients.length === 0) {
    console.log(`  ❌ No se encontraron ingredientes para: ${product.name}`)
    return null
  }

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    ingredients: ingredients
  }
}

// Obtener todos los productos que necesitan recetas
const productsNeedingRecipes = products.filter(p => 
  p.category === 'coctel' || 
  p.category === 'cafe-caliente' || 
  p.category === 'cafe-frio'
)

console.log(`\n📋 Encontrados ${productsNeedingRecipes.length} productos que necesitan recetas:\n`)

const recipesToCreate = []

for (const product of productsNeedingRecipes) {
  console.log(`🍽️  Procesando: ${product.name} (${product.category})`)
  const recipe = createRecipeForProduct(product)
  
  if (recipe) {
    recipesToCreate.push(recipe)
    console.log(`  ✅ Receta creada con ${recipe.ingredients.length} ingrediente(s)`)
    recipe.ingredients.forEach(ing => {
      console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit}`)
    })
  }
  console.log('')
}

console.log(`\n📝 Total de recetas a crear: ${recipesToCreate.length}\n`)

// Mostrar resumen de ingredientes encontrados en inventario
console.log('📦 Ingredientes disponibles en inventario:')
const inventoryCategories = {}
inventory.forEach(item => {
  const category = item.category || 'otros'
  if (!inventoryCategories[category]) {
    inventoryCategories[category] = []
  }
  inventoryCategories[category].push({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit
  })
})

Object.keys(inventoryCategories).forEach(category => {
  console.log(`\n  ${category}:`)
  inventoryCategories[category].slice(0, 5).forEach(item => {
    console.log(`    - ${item.name} (${item.quantity} ${item.unit})`)
  })
  if (inventoryCategories[category].length > 5) {
    console.log(`    ... y ${inventoryCategories[category].length - 5} más`)
  }
})

// Exportar las recetas en formato para API
const recipesOutput = {
  recipes: recipesToCreate,
  total: recipesToCreate.length,
  created: new Date().toISOString()
}

fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'recipes-to-create.json'),
  JSON.stringify(recipesOutput, null, 2)
)

console.log(`\n✅ Recetas guardadas en: data/recipes-to-create.json`)
console.log(`\n💡 Para crear estas recetas en Firebase, ejecuta:`)
console.log(`   node scripts/create-recipes-in-firebase.js\n`)
