/**
 * Script para probar los cálculos de disponibilidad con las recetas actuales
 */

const fs = require('fs')
const path = require('path')

const productsPath = path.join(__dirname, '..', 'data', 'products.json')
const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json')

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

// Simular conversión de unidades (igual que en stock-service.ts)
function convertStockToRecipeUnit(inventoryStock, inventoryUnit, recipeUnit) {
  const invUnit = (inventoryUnit || '').toLowerCase()
  const recUnit = (recipeUnit || '').toLowerCase()
  
  if (recUnit === invUnit) {
    return inventoryStock
  }
  
  // Botellas -> ml (750ml por botella)
  if (invUnit.includes('botella') && recUnit === 'ml') {
    return inventoryStock * 750
  }
  
  // Paquetes -> gr (500gr por paquete)
  if (invUnit.includes('paquete') && recUnit === 'gr') {
    return inventoryStock * 500
  }
  
  // Bolsas -> ml (1000ml por bolsa)
  if (invUnit.includes('bolsa') && recUnit === 'ml') {
    return inventoryStock * 1000
  }
  
  // Bolsas -> gr (1000gr por bolsa)
  if (invUnit.includes('bolsa') && recUnit === 'gr') {
    return inventoryStock * 1000
  }
  
  // Conversiones estándar
  if (recUnit === 'ml' && (invUnit === 'l' || invUnit === 'litro')) {
    return inventoryStock * 1000
  }
  if (recUnit === 'gr' && (invUnit === 'kg' || invUnit === 'kilogramo')) {
    return inventoryStock * 1000
  }
  
  return inventoryStock
}

async function testCalculations() {
  console.log('\n🧪 Probando cálculos de disponibilidad...\n')
  
  const recipes = await fetch('http://localhost:3000/api/recipes').then(r => r.json())
  
  for (const recipe of recipes) {
    console.log(`\n🍽️  ${recipe.productName}`)
    console.log(`   Categoría: ${recipe.category}`)
    
    const availabilities = []
    let limitingIngredient = null
    let minAvailability = Infinity
    
    for (const ingredient of recipe.ingredients) {
      const invItem = inventory.find(i => i.id === ingredient.productId)
      
      if (!invItem) {
        console.log(`   ❌ ${ingredient.productName}: NO ENCONTRADO EN INVENTARIO`)
        continue
      }
      
      const stock = invItem.quantity || 0
      const stockConverted = convertStockToRecipeUnit(stock, invItem.unit, ingredient.unit)
      const available = Math.floor(stockConverted / ingredient.quantity)
      
      availabilities.push(available)
      
      if (available < minAvailability) {
        minAvailability = available
        limitingIngredient = {
          name: ingredient.productName,
          stock: stock,
          stockUnit: invItem.unit,
          stockConverted: stockConverted,
          required: ingredient.quantity,
          requiredUnit: ingredient.unit,
          available: available
        }
      }
      
      console.log(`   ${ingredient.productName}:`)
      console.log(`      Stock: ${stock} ${invItem.unit} → ${stockConverted.toFixed(0)} ${ingredient.unit}`)
      console.log(`      Requerido: ${ingredient.quantity} ${ingredient.unit}`)
      console.log(`      Disponible: ${available} preparaciones`)
    }
    
    if (limitingIngredient) {
      console.log(`\n   ✅ Disponibilidad total: ${minAvailability} preparaciones`)
      console.log(`   🔴 Ingrediente limitante: ${limitingIngredient.name} (${limitingIngredient.available} disponibles)`)
    } else {
      console.log(`\n   ⚠️  No se pudo calcular disponibilidad`)
    }
  }
  
  console.log('\n')
}

testCalculations().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
