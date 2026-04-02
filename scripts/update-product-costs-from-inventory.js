#!/usr/bin/env node

/**
 * Script para actualizar costos de productos basándose en inventario y recetas
 * 
 * Uso: node scripts/update-product-costs-from-inventory.js
 */

require('./load-env-local.cjs')

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Configurar ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Error: Base de datos no encontrada en:', dbPath)
  process.exit(1)
}

// Conectar a la base de datos
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Función para normalizar nombres (eliminar acentos, convertir a minúsculas)
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Función para buscar item en inventario por nombre (búsqueda flexible)
function findInventoryItem(inventory, searchName) {
  const normalizedSearch = normalizeName(searchName)
  return inventory.find(item => {
    const normalizedItem = normalizeName(item.name || '')
    return normalizedItem === normalizedSearch ||
           normalizedItem.includes(normalizedSearch) ||
           normalizedSearch.includes(normalizedItem)
  })
}

// Función para calcular costo desde receta
function calculateCostFromRecipe(recipe, inventory) {
  if (!recipe || !recipe.ingredients) return null
  
  try {
    const ingredients = typeof recipe.ingredients === 'string' 
      ? JSON.parse(recipe.ingredients) 
      : recipe.ingredients
    
    if (!Array.isArray(ingredients)) return null
    
    let totalCost = 0
    
    for (const ingredient of ingredients) {
      // Buscar el ingrediente en inventario
      const inventoryItem = findInventoryItem(inventory, ingredient.productName || ingredient.name)
      
      if (!inventoryItem || !inventoryItem.unitPrice) {
        // Si no se encuentra, estimar costo mínimo
        continue
      }
      
      // Calcular costo del ingrediente según cantidad y unidad
      const requiredQuantity = ingredient.quantity || 0
      const requiredUnit = (ingredient.unit || '').toLowerCase()
      const inventoryQuantity = inventoryItem.quantity || 0
      const inventoryUnit = (inventoryItem.unit || '').toLowerCase()
      const inventoryUnitPrice = inventoryItem.unitPrice || 0
      
      let ingredientCost = 0
      
      // Si las unidades coinciden, calcular directamente
      if (requiredUnit === inventoryUnit) {
        ingredientCost = (inventoryUnitPrice / inventoryQuantity) * requiredQuantity
      } else {
        // Conversiones aproximadas
        if (requiredUnit === 'gr' && inventoryUnit === 'gramo') {
          ingredientCost = (inventoryUnitPrice / inventoryQuantity) * requiredQuantity
        } else if (requiredUnit === 'ml' && inventoryUnit === 'ml') {
          ingredientCost = (inventoryUnitPrice / inventoryQuantity) * requiredQuantity
        } else if ((requiredUnit === 'unidad' || requiredUnit === 'unidades') && 
                   (inventoryUnit === 'unidad' || inventoryUnit === 'unidades')) {
          ingredientCost = inventoryUnitPrice * requiredQuantity
        } else {
          // Estimación aproximada
          ingredientCost = (inventoryUnitPrice / inventoryQuantity) * requiredQuantity
        }
      }
      
      totalCost += ingredientCost
    }
    
    // Agregar un pequeño margen para otros costos (agua, gas, etc.)
    return totalCost > 0 ? Math.round(totalCost * 1.1) : null
  } catch (error) {
    console.error(`Error calculando costo desde receta: ${error.message}`)
    return null
  }
}

// Mapeo manual de productos a costos (para casos especiales)
const specialCostMappings = {
  'vino-tinto-botella': (inventory) => {
    // Buscar Vino Santa Elena (el que se usa para copas)
    const vino = findInventoryItem(inventory, 'Vino Santa Elena')
    return vino ? vino.unitPrice : null
  },
  'tequila-jose-cuervo-botella': (inventory) => {
    // Buscar José Cuervo en inventario
    const tequila = findInventoryItem(inventory, 'José Cuervo')
    if (tequila) {
      // Si es 0.25 botella, calcular precio completo
      if (tequila.quantity === 0.25) {
        return tequila.totalValue * 4
      }
      return tequila.unitPrice
    }
    return null
  },
  'prod-1768843715583-n44rw1kv2': (inventory) => {
    // Cigarrillo
    const cigarrillo = findInventoryItem(inventory, 'Cigarrillo')
    return cigarrillo ? cigarrillo.unitPrice : 1000 // Precio aproximado si no se encuentra
  },
  'bebida-1767479680271-wp5qa9j7m': (inventory) => {
    // Margaritas - calcular desde receta
    // Tequila 45ml + Triple Sec 20ml + otros
    const tequila = findInventoryItem(inventory, 'Tequila Olmeca Blanco')
    const tripleSec = findInventoryItem(inventory, 'Triple Sec')
    
    let cost = 0
    if (tequila) {
      // 700ml botella = ~23 shots de 30ml, necesitamos 45ml = 1.5 shots
      const tequilaCost = (tequila.unitPrice / 23) * 1.5
      cost += tequilaCost
    }
    if (tripleSec) {
      // Estimado 20ml de triple sec
      cost += (tripleSec.unitPrice / 30) * 20
    }
    // Limón, hielo, sal - estimado 1000
    return cost > 0 ? Math.round(cost + 1000) : null
  },
  'bebida-1767479537737-5pcmv20sn': (inventory) => {
    // Hervido de fruta de temporada
    // Base cóctel Brissart granadina 50ml + Bretaña personal x6 150ml
    const base = findInventoryItem(inventory, 'Base cóctel Brissart granadina')
    const soda = findInventoryItem(inventory, 'Bretaña personal')
    const frutas = findInventoryItem(inventory, 'Frutas para hervidos')
    
    let cost = 0
    if (base) {
      cost += (base.unitPrice / 1000) * 50 // Estimado 1000ml en botella
    }
    if (soda) {
      cost += soda.unitPrice || 0
    }
    if (frutas) {
      // Frutas: estimado 100gr por hervido
      cost += (frutas.unitPrice / frutas.quantity) * 0.1 // Convertir a kg
    }
    // Otros costos - estimado 500
    return cost > 0 ? Math.round(cost + 500) : null
  },
  'combo-cafe-pastel': (inventory) => {
    // Café artesanal caliente + pastel del día
    // Café: estimado 3000 + Pastel: estimado 4000
    return 7000 // Estimado aproximado
  },
  'cafe-helado': (inventory) => {
    // Café helado artesanal (affogato)
    // Similar al café pero con helado
    const cafe = findInventoryItem(inventory, 'Café Sello Rojo')
    let cost = 0
    if (cafe) {
      // 10gr café por taza
      if (cafe.unit === 'Gramo') {
        cost += (cafe.unitPrice / cafe.quantity) * 10
      } else {
        cost += 300 // Estimado
      }
    }
    // Hielo, azúcar, otros - estimado 2000
    return cost > 0 ? Math.round(cost + 2000) : null
  },
  'acompanante': (inventory) => {
    // Acompañante del día (Empanada, Buñuelo)
    // No hay inventario para esto, estimado basado en precio
    return 1500 // Estimado 50% del precio de venta
  },
  'bebida-1767479422734-8ofoa07j2': (inventory) => {
    // Coctel de soda sin licor
    const soda = findInventoryItem(inventory, 'Soda Bretaña')
    let cost = 0
    if (soda) {
      cost += soda.unitPrice || 0
    }
    // Hielo, limón, otros - estimado 500
    return cost > 0 ? Math.round(cost + 500) : null
  },
  'bebida-1767478125019-7gnyg8glz': (inventory) => {
    // Copa de vino
    const vino = findInventoryItem(inventory, 'Vino Santa Elena')
    if (vino) {
      // 150ml por copa, botella de 750ml = 5 copas
      return Math.round(vino.unitPrice / 5)
    }
    return null
  },
  'pastel-dia': (inventory) => {
    // Pastel del día - no hay inventario específico, estimado
    return 4000 // Estimado basado en precio de venta
  },
  'sandwich-dia': (inventory) => {
    // Sándwich del día - no hay inventario específico, estimado
    return 5000 // Estimado basado en precio de venta
  }
}

async function updateProductCosts() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ACTUALIZANDO COSTOS DE PRODUCTOS')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  // Obtener todos los productos sin costo
  const products = db.prepare('SELECT * FROM products WHERE cost IS NULL OR cost = 0').all()
  console.log(`📦 Productos sin costo encontrados: ${products.length}\n`)
  
  // Obtener inventario
  const inventory = db.prepare('SELECT * FROM inventory').all()
  console.log(`📦 Items en inventario: ${inventory.length}\n`)
  
  // Obtener recetas
  const recipes = db.prepare('SELECT * FROM recipes').all()
  console.log(`📦 Recetas disponibles: ${recipes.length}\n`)
  
  const updates = []
  
  products.forEach(product => {
    let newCost = null
    
    // 1. Intentar mapeo especial
    if (specialCostMappings[product.id]) {
      newCost = specialCostMappings[product.id](inventory)
      if (newCost) {
        updates.push({
          id: product.id,
          name: product.name,
          method: 'Mapeo especial',
          oldCost: product.cost || 0,
          newCost: newCost
        })
      }
    }
    
    // 2. Si no se encontró, buscar en recetas
    if (!newCost) {
      const recipe = recipes.find(r => {
        const recipeProductName = normalizeName(r.productName || '')
        const productName = normalizeName(product.name || '')
        return recipeProductName === productName ||
               recipeProductName.includes(productName) ||
               productName.includes(recipeProductName)
      })
      
      if (recipe) {
        newCost = calculateCostFromRecipe(recipe, inventory)
        if (newCost) {
          updates.push({
            id: product.id,
            name: product.name,
            method: 'Cálculo desde receta',
            oldCost: product.cost || 0,
            newCost: newCost
          })
        }
      }
    }
    
    // 3. Si no se encontró, buscar directamente en inventario
    if (!newCost) {
      const inventoryItem = findInventoryItem(inventory, product.name)
      if (inventoryItem && inventoryItem.unitPrice) {
        newCost = inventoryItem.unitPrice
        updates.push({
          id: product.id,
          name: product.name,
          method: 'Búsqueda directa en inventario',
          oldCost: product.cost || 0,
          newCost: newCost
        })
      }
    }
    
    // Actualizar costo en la base de datos si se encontró
    if (newCost && newCost > 0) {
      db.prepare('UPDATE products SET cost = ? WHERE id = ?').run(newCost, product.id)
    }
  })
  
  // Mostrar resultados
  console.log('═'.repeat(80))
  console.log('📊 RESULTADOS')
  console.log('═'.repeat(80))
  
  if (updates.length === 0) {
    console.log('\n⚠️  No se encontraron costos para actualizar\n')
  } else {
    console.log(`\n✅ Costos actualizados: ${updates.length}\n`)
    console.log('Detalle de actualizaciones:\n')
    
    updates.forEach(update => {
      const price = db.prepare('SELECT price FROM products WHERE id = ?').get(update.id)?.price || 0
      const margin = price - update.newCost
      const marginPercent = price > 0 ? ((margin / price) * 100).toFixed(2) : 0
      
      console.log(`  ✅ ${update.name}`)
      console.log(`     Método: ${update.method}`)
      console.log(`     Costo anterior: $${(update.oldCost || 0).toLocaleString('es-CO')}`)
      console.log(`     Costo nuevo: $${Math.round(update.newCost).toLocaleString('es-CO')}`)
      console.log(`     Precio venta: $${price.toLocaleString('es-CO')}`)
      console.log(`     Margen: $${Math.round(margin).toLocaleString('es-CO')} (${marginPercent}%)`)
      console.log('')
    })
  }
  
  // Productos que no se pudieron actualizar
  const remaining = products.length - updates.length
  if (remaining > 0) {
    console.log(`\n⚠️  Productos sin costo asignado: ${remaining}`)
    const remainingProducts = products.filter(p => 
      !updates.find(u => u.id === p.id)
    )
    remainingProducts.forEach(p => {
      console.log(`     - ${p.name} (ID: ${p.id})`)
    })
  }
  
  console.log('\n' + '═'.repeat(80))
  console.log('✅ PROCESO COMPLETADO')
  console.log('═'.repeat(80) + '\n')
  
  db.close()
}

// Ejecutar
updateProductCosts().catch(error => {
  console.error('\n❌ Error:', error.message)
  console.error(error.stack)
  process.exit(1)
})
