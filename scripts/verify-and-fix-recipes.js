/**
 * Script para verificar y corregir recetas con ingredientes reales del inventario
 * Ajusta cantidades y unidades según el stock disponible
 */

const fs = require('fs')
const path = require('path')

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

// Buscar ingrediente en inventario por ID o nombre
function findIngredientInInventory(searchId, searchName) {
  // Primero buscar por ID exacto
  if (searchId) {
    const byId = inventory.find(item => item.id === searchId)
    if (byId) return byId
  }
  
  // Luego buscar por nombre normalizado
  const normalized = normalizeName(searchName || '')
  return inventory.find(item => {
    const itemName = normalizeName(item.name || '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

// Convertir unidades del inventario a unidades de receta
function convertUnit(inventoryUnit, recipeUnit) {
  const invUnit = (inventoryUnit || '').toLowerCase()
  const recUnit = (recipeUnit || '').toLowerCase()
  
  // Si ya coinciden, mantener
  if (invUnit === recUnit || 
      (invUnit.includes('ml') && recUnit === 'ml') ||
      (invUnit.includes('gr') && recUnit === 'gr') ||
      (invUnit.includes('gram') && recUnit === 'gr') ||
      (invUnit.includes('unidad') && recUnit === 'unidad') ||
      (invUnit.includes('botella') && recUnit === 'ml')) {
    return recipeUnit
  }
  
  // Conversiones comunes
  if (invUnit.includes('botella') && recUnit === 'ml') {
    // Asumir botella de 750ml para licores
    return 'ml'
  }
  
  if (invUnit.includes('paquete') && recUnit === 'gr') {
    // Para café en paquete, mantener gr
    return 'gr'
  }
  
  if (invUnit.includes('bolsa') && recUnit === 'ml') {
    // Para leche en bolsa, mantener ml
    return 'ml'
  }
  
  return recipeUnit
}

// Obtener recetas actuales desde la API
async function getCurrentRecipes() {
  try {
    const response = await fetch('http://localhost:3000/api/recipes')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error obteniendo recetas:', error.message)
    return []
  }
}

// Actualizar receta en Firebase
async function updateRecipe(recipeId, recipe) {
  try {
    const response = await fetch(`http://localhost:3000/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: recipe.productName,
        category: recipe.category,
        ingredients: recipe.ingredients
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Verificar y corregir ingredientes de una receta
function verifyAndFixRecipeIngredients(recipe) {
  const fixedIngredients = []
  const warnings = []
  
  for (const ingredient of recipe.ingredients) {
    const inventoryItem = findIngredientInInventory(ingredient.productId, ingredient.productName)
    
    if (!inventoryItem) {
      warnings.push(`⚠️  Ingrediente no encontrado: ${ingredient.productName} (${ingredient.productId})`)
      continue
    }
    
    // Verificar stock disponible
    const stock = inventoryItem.quantity || 0
    if (stock <= 0) {
      warnings.push(`⚠️  Sin stock: ${inventoryItem.name} (${stock} ${inventoryItem.unit})`)
    }
    
    // Ajustar unidad según el inventario
    const correctedUnit = convertUnit(inventoryItem.unit, ingredient.unit)
    
    // Ajustar cantidad si es necesario (por ejemplo, si el inventario está en botellas y necesitamos ml)
    let correctedQuantity = ingredient.quantity
    
    // Si el inventario está en botellas y necesitamos ml, convertir
    if (inventoryItem.unit && inventoryItem.unit.toLowerCase().includes('botella') && correctedUnit === 'ml') {
      // Asumir botella de 750ml para licores
      // La cantidad en la receta ya está en ml, así que está bien
    }
    
    // Si el inventario está en paquete y necesitamos gr, ajustar
    if (inventoryItem.unit && inventoryItem.unit.toLowerCase().includes('paquete') && correctedUnit === 'gr') {
      // Asumir que un paquete de café tiene ~500gr
      // La cantidad en la receta ya está en gr por taza, así que está bien
    }
    
    fixedIngredients.push({
      productId: inventoryItem.id,
      productName: inventoryItem.name,
      quantity: correctedQuantity,
      unit: correctedUnit
    })
  }
  
  return {
    ingredients: fixedIngredients,
    warnings
  }
}

async function main() {
  console.log('\n🔍 Verificando y corrigiendo recetas...\n')
  
  const currentRecipes = await getCurrentRecipes()
  
  if (currentRecipes.length === 0) {
    console.log('❌ No se encontraron recetas. Asegúrate de que el servidor esté corriendo.')
    return
  }
  
  console.log(`📋 Encontradas ${currentRecipes.length} recetas\n`)
  
  const results = {
    updated: [],
    failed: [],
    warnings: []
  }
  
  for (const recipe of currentRecipes) {
    console.log(`🍽️  Verificando: ${recipe.productName}`)
    
    const { ingredients, warnings } = verifyAndFixRecipeIngredients(recipe)
    
    if (warnings.length > 0) {
      warnings.forEach(w => console.log(`  ${w}`))
      results.warnings.push({
        productName: recipe.productName,
        warnings
      })
    }
    
    if (ingredients.length === 0) {
      console.log(`  ❌ No se encontraron ingredientes válidos`)
      results.failed.push({
        productName: recipe.productName,
        reason: 'Sin ingredientes válidos en inventario'
      })
      continue
    }
    
    // Solo actualizar si hay cambios
    const hasChanges = JSON.stringify(recipe.ingredients) !== JSON.stringify(ingredients)
    
    if (hasChanges) {
      console.log(`  🔄 Actualizando receta con ${ingredients.length} ingrediente(s)`)
      
      const result = await updateRecipe(recipe.id, {
        ...recipe,
        ingredients
      })
      
      if (result.success !== false) {
        console.log(`  ✅ Receta actualizada`)
        results.updated.push({
          productName: recipe.productName,
          recipeId: recipe.id,
          ingredientsCount: ingredients.length
        })
      } else {
        console.log(`  ❌ Error: ${result.error}`)
        results.failed.push({
          productName: recipe.productName,
          reason: result.error
        })
      }
    } else {
      console.log(`  ✅ Receta correcta (${ingredients.length} ingredientes)`)
    }
    
    // Mostrar ingredientes
    ingredients.forEach(ing => {
      const invItem = inventory.find(i => i.id === ing.productId)
      const stock = invItem?.quantity || 0
      const unit = invItem?.unit || 'unidad'
      console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit} (Stock: ${stock} ${unit})`)
    })
    
    console.log('')
    
    // Pausa para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log(`\n📊 Resumen:`)
  console.log(`  ✅ Actualizadas: ${results.updated.length}`)
  console.log(`  ✅ Correctas: ${currentRecipes.length - results.updated.length - results.failed.length}`)
  console.log(`  ⚠️  Con advertencias: ${results.warnings.length}`)
  console.log(`  ❌ Fallidas: ${results.failed.length}\n`)
  
  if (results.failed.length > 0) {
    console.log(`❌ Recetas que fallaron:`)
    results.failed.forEach(item => {
      console.log(`  - ${item.productName}: ${item.reason}`)
    })
    console.log('')
  }
  
  // Guardar resultados
  const resultsPath = path.join(__dirname, '..', 'data', 'recipes-verification-results.json')
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(results, null, 2)
  )
  
  console.log(`💾 Resultados guardados en: data/recipes-verification-results.json\n`)
}

main().catch(error => {
  console.error('Error fatal:', error)
  process.exit(1)
})
