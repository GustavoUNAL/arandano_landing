/**
 * Script para mejorar las recetas agregando ingredientes adicionales del inventario
 * y corrigiendo unidades para que coincidan con el stock real
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

// Buscar ingrediente en inventario
function findIngredientInInventory(searchName, category = null) {
  const normalized = normalizeName(searchName || '')
  
  let candidates = inventory
  
  if (category) {
    candidates = inventory.filter(item => 
      normalizeName(item.category || '').includes(normalizeName(category))
    )
  }
  
  return candidates.find(item => {
    const itemName = normalizeName(item.name || '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

// Obtener recetas actuales
async function getCurrentRecipes() {
  try {
    const response = await fetch('http://localhost:3000/api/recipes')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error obteniendo recetas:', error.message)
    return []
  }
}

// Actualizar receta
async function updateRecipe(recipeId, recipe) {
  try {
    const response = await fetch(`http://localhost:3000/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

// Mejorar receta con ingredientes adicionales según descripción del producto
function enhanceRecipe(recipe, product) {
  const enhancedIngredients = [...recipe.ingredients]
  const productDesc = (product.description || '').toLowerCase()
  
  // Cóctel Arándano: "Jugo de arándano, Campari y jugo de naranja"
  if (recipe.productId === 'coctel-arandano') {
    // Buscar Campari si no está
    const hasCampari = enhancedIngredients.some(ing => 
      normalizeName(ing.productName).includes('campari')
    )
    if (!hasCampari) {
      const campari = findIngredientInInventory('Campari')
      if (campari) {
        enhancedIngredients.push({
          productId: campari.id,
          productName: campari.name,
          quantity: 30,
          unit: 'ml'
        })
      }
    }
    
    // Buscar jugo de naranja si no está
    const hasNaranja = enhancedIngredients.some(ing => 
      normalizeName(ing.productName).includes('naranja') || 
      normalizeName(ing.productName).includes('jugo')
    )
    if (!hasNaranja) {
      // Buscar cualquier base o sirope que pueda servir como jugo
      const jugo = findIngredientInInventory('jugo', 'siropes y bases') ||
                   findIngredientInInventory('naranja', 'siropes y bases')
      if (jugo) {
        enhancedIngredients.push({
          productId: jugo.id,
          productName: jugo.name,
          quantity: 50,
          unit: 'ml'
        })
      }
    }
  }
  
  // Cóctel de campari: "Delicioso coctel seco y dulce con jugo de naranja"
  if (recipe.productId === 'bebida-1767478463497-c2aya0ta0') {
    const hasNaranja = enhancedIngredients.some(ing => 
      normalizeName(ing.productName).includes('naranja') || 
      normalizeName(ing.productName).includes('jugo')
    )
    if (!hasNaranja) {
      const jugo = findIngredientInInventory('jugo', 'siropes y bases') ||
                   findIngredientInInventory('naranja', 'siropes y bases')
      if (jugo) {
        enhancedIngredients.push({
          productId: jugo.id,
          productName: jugo.name,
          quantity: 50,
          unit: 'ml'
        })
      }
    }
  }
  
  // Vino caliente: puede necesitar especias o azúcar adicional
  if (recipe.productId === 'vino-caliente') {
    const hasEspecias = enhancedIngredients.some(ing => 
      normalizeName(ing.productName).includes('especia') ||
      normalizeName(ing.productName).includes('canela') ||
      normalizeName(ing.productName).includes('clavo')
    )
    if (!hasEspecias) {
      const aromatics = findIngredientInInventory('Aromáticas')
      if (aromatics) {
        enhancedIngredients.push({
          productId: aromatics.id,
          productName: aromatics.name,
          quantity: 1,
          unit: 'unidad'
        })
      }
    }
  }
  
  // Margaritas: puede necesitar limón o sal
  if (recipe.productId === 'bebida-1767479680271-wp5qa9j7m') {
    const hasLimon = enhancedIngredients.some(ing => 
      normalizeName(ing.productName).includes('limon') ||
      normalizeName(ing.productName).includes('limón')
    )
    if (!hasLimon) {
      // Buscar cualquier base ácida o cítrica
      const limon = findIngredientInInventory('limon', 'siropes y bases')
      if (limon) {
        enhancedIngredients.push({
          productId: limon.id,
          productName: limon.name,
          quantity: 20,
          unit: 'ml'
        })
      }
    }
  }
  
  return enhancedIngredients
}

// Corregir unidades según el inventario
function correctUnits(ingredients) {
  return ingredients.map(ing => {
    const invItem = inventory.find(i => i.id === ing.productId)
    if (!invItem) return ing
    
    const invUnit = (invItem.unit || '').toLowerCase()
    const recUnit = (ing.unit || '').toLowerCase()
    
    // Si las unidades ya coinciden o son compatibles, mantener
    if (invUnit === recUnit) return ing
    
    // Conversiones específicas según el tipo de producto
    // Botella de licor -> ml (asumir 750ml por botella)
    if (invUnit.includes('botella') && recUnit === 'ml') {
      return ing // Mantener ml, el cálculo se hará con la conversión
    }
    
    // Paquete de café -> gr (asumir 500gr por paquete)
    if (invUnit.includes('paquete') && recUnit === 'gr') {
      return ing // Mantener gr, el cálculo se hará con la conversión
    }
    
    // Bolsa de leche -> ml (asumir 1L = 1000ml por bolsa)
    if (invUnit.includes('bolsa') && recUnit === 'ml') {
      return ing // Mantener ml, el cálculo se hará con la conversión
    }
    
    // Bolsa de hielo -> gr
    if (invUnit.includes('bolsa') && recUnit === 'gr') {
      return ing // Mantener gr
    }
    
    return ing
  })
}

async function main() {
  console.log('\n🔧 Mejorando recetas con ingredientes del inventario...\n')
  
  const currentRecipes = await getCurrentRecipes()
  
  if (currentRecipes.length === 0) {
    console.log('❌ No se encontraron recetas')
    return
  }
  
  const results = {
    enhanced: [],
    unchanged: [],
    failed: []
  }
  
  for (const recipe of currentRecipes) {
    const product = products.find(p => p.id === recipe.productId)
    if (!product) {
      console.log(`⚠️  Producto no encontrado: ${recipe.productName}`)
      continue
    }
    
    console.log(`🍽️  Mejorando: ${recipe.productName}`)
    
    // Mejorar con ingredientes adicionales
    let enhancedIngredients = enhanceRecipe(recipe, product)
    
    // Corregir unidades
    enhancedIngredients = correctUnits(enhancedIngredients)
    
    // Verificar que todos los ingredientes existan en inventario
    const validIngredients = enhancedIngredients.filter(ing => {
      const invItem = inventory.find(i => i.id === ing.productId)
      if (!invItem) {
        console.log(`  ⚠️  Ingrediente no encontrado: ${ing.productName}`)
        return false
      }
      return true
    })
    
    if (validIngredients.length === 0) {
      console.log(`  ❌ No hay ingredientes válidos`)
      results.failed.push({ productName: recipe.productName })
      continue
    }
    
    // Solo actualizar si hay cambios
    const hasChanges = JSON.stringify(recipe.ingredients) !== JSON.stringify(validIngredients)
    
    if (hasChanges) {
      console.log(`  🔄 Actualizando: ${recipe.ingredients.length} -> ${validIngredients.length} ingredientes`)
      
      const result = await updateRecipe(recipe.id, {
        ...recipe,
        ingredients: validIngredients
      })
      
      if (result.success !== false) {
        console.log(`  ✅ Receta mejorada`)
        results.enhanced.push({
          productName: recipe.productName,
          oldCount: recipe.ingredients.length,
          newCount: validIngredients.length
        })
      } else {
        console.log(`  ❌ Error: ${result.error}`)
        results.failed.push({ productName: recipe.productName, error: result.error })
      }
    } else {
      console.log(`  ✅ Receta ya está optimizada (${validIngredients.length} ingredientes)`)
      results.unchanged.push({ productName: recipe.productName })
    }
    
    // Mostrar ingredientes finales
    validIngredients.forEach(ing => {
      const invItem = inventory.find(i => i.id === ing.productId)
      const stock = invItem?.quantity || 0
      const unit = invItem?.unit || 'unidad'
      console.log(`     ✓ ${ing.productName}: ${ing.quantity} ${ing.unit} (Stock: ${stock} ${unit})`)
    })
    
    console.log('')
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log(`\n📊 Resumen:`)
  console.log(`  🔄 Mejoradas: ${results.enhanced.length}`)
  console.log(`  ✅ Sin cambios: ${results.unchanged.length}`)
  console.log(`  ❌ Fallidas: ${results.failed.length}\n`)
  
  if (results.enhanced.length > 0) {
    console.log(`✨ Recetas mejoradas:`)
    results.enhanced.forEach(item => {
      console.log(`  - ${item.productName}: ${item.oldCount} → ${item.newCount} ingredientes`)
    })
    console.log('')
  }
}

main().catch(error => {
  console.error('Error fatal:', error)
  process.exit(1)
})
