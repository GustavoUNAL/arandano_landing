/**
 * Servicio centralizado para cálculo de stock y disponibilidad
 * - Stock real de productos desde Firebase
 * - Disponibilidad de cócteles/cafés basada en recetas
 * - Botellas completas para licores
 */

import { Product } from './products'
import { InventoryItem, getInventory } from './db-inventory'
import { Recipe, getRecipeByProductId } from './db-recipes'
// import { Sale, getSalesByProduct } from './db-sales' // No usado actualmente

export interface ProductStockInfo {
  product: Product
  stock: number // Stock real calculado
  hasDirectStock: boolean // Si el producto tiene stock directo
  availability?: number // Disponibilidad (solo para cócteles/cafés)
  fullBottles?: number // Botellas completas (solo para licores)
  hasRecipe: boolean // Si tiene receta
  recipe?: Recipe // Receta asociada
}

export interface ProductAvailability {
  available: number // Cantidad que se puede preparar
  limitingIngredient?: {
    productId: string
    productName: string
    stock: number
    required: number
  }
  status: 'available' | 'no-recipe' | 'no-ingredients'
}

/**
 * Calcula el stock real de un producto desde Firebase
 * - Si tiene stock directo -> usar ese
 * - Si el stock se calcula por movimientos -> calcular: stock = entradas - salidas
 */
export async function calculateProductStock(product: Product): Promise<number> {
  // Si el producto tiene un campo stock directo y es válido, usarlo
  // El stock directo puede venir de actualizaciones manuales o del cálculo anterior
  if (product.stock !== undefined && product.stock !== null && product.stock >= 0) {
    return product.stock
  }

  // Si no tiene stock directo, calcular desde inventario
  try {
    const inventory = await getInventory()
    
    // Buscar items de inventario que coincidan con el producto
    const matchingItems = inventory.filter(item => {
      // Normalizar nombres para comparación
      const normalizedProductName = normalizeName(product.name)
      const normalizedItemName = normalizeName(item.name || '')
      
      return normalizedItemName === normalizedProductName ||
             normalizedItemName.includes(normalizedProductName) ||
             normalizedProductName.includes(normalizedItemName)
    })

    if (matchingItems.length > 0) {
      // Sumar cantidades de todos los items que coinciden
      const totalStock = matchingItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      return totalStock
    }

    // Si no hay inventario, retornar 0 o el stock manual si existe
    return product.stock || 0
  } catch (error) {
    console.error('[Stock] Error calculando stock:', error)
    // En caso de error, retornar stock manual o 0
    return product.stock || 0
  }
}

/**
 * Calcula la disponibilidad de un cóctel/café basado en su receta
 * Retorna el número de preparaciones posibles según el ingrediente limitante
 */
export async function calculateProductAvailability(
  product: Product,
  recipe?: Recipe
): Promise<ProductAvailability> {
  // Si no hay receta, retornar sin disponibilidad
  if (!recipe) {
    return {
      available: 0,
      status: 'no-recipe'
    }
  }

  // Si no es cóctel ni café, no calcular disponibilidad
  if (product.category !== 'coctel' && 
      product.category !== 'cafe-caliente' && 
      product.category !== 'cafe-frio') {
    return {
      available: 0,
      status: 'no-recipe'
    }
  }

  try {
    const inventory = await getInventory()
    
    if (inventory.length === 0) {
      console.warn(`[Stock] No hay inventario disponible para calcular disponibilidad de ${product.name}`)
      return {
        available: 0,
        status: 'no-ingredients'
      }
    }
    
    const availabilities: number[] = []
    let limitingIngredient: {
      productId: string
      productName: string
      stock: number
      required: number
    } | undefined

    // Calcular disponibilidad para cada ingrediente
    for (const ingredient of recipe.ingredients) {
      // Buscar el ingrediente en inventario
      // Primero por ID exacto
      let inventoryItem = inventory.find(item => item.id === ingredient.productId)
      
      // Si no se encuentra por ID, buscar por nombre normalizado
      if (!inventoryItem) {
        const normalizedIngredientName = normalizeName(ingredient.productName)
        inventoryItem = inventory.find(item => {
          const normalizedItemName = normalizeName(item.name || '')
          return normalizedItemName === normalizedIngredientName ||
                 normalizedItemName.includes(normalizedIngredientName) ||
                 normalizedIngredientName.includes(normalizedItemName)
        })
      }
      
      if (!inventoryItem) {
        // Si no se encuentra el ingrediente, disponibilidad es 0
        console.warn(`[Stock] Ingrediente no encontrado en inventario: ${ingredient.productName} (${ingredient.productId})`)
        return {
          available: 0,
          limitingIngredient: {
            productId: ingredient.productId,
            productName: ingredient.productName,
            stock: 0,
            required: ingredient.quantity
          },
          status: 'no-ingredients'
        }
      }

      // Obtener stock del ingrediente
      const ingredientStock = inventoryItem.quantity || 0
      
      // Calcular cuántas preparaciones son posibles con este ingrediente
      // Convertir unidades si es necesario
      let availableCount = 0
      
      // Normalizar unidades para comparación
      const recipeUnit = ingredient.unit.toLowerCase()
      const inventoryUnit = inventoryItem.unit.toLowerCase()
      
      // Si las unidades coinciden, hacer el cálculo directo
      if (recipeUnit === inventoryUnit) {
        if (ingredient.quantity > 0) {
          availableCount = Math.floor(ingredientStock / ingredient.quantity)
        } else {
          availableCount = ingredientStock > 0 ? Infinity : 0
        }
      } else {
        // Conversión de unidades común (se puede mejorar)
        // ml <-> l: 1 l = 1000 ml
        // gr <-> kg: 1 kg = 1000 gr
        // unidad se mantiene igual
        
        let stockConverted = ingredientStock
        let requiredConverted = ingredient.quantity
        
        // Convertir stock del inventario a la unidad de la receta
        if (recipeUnit === 'ml' && (inventoryUnit === 'l' || inventoryUnit === 'litro' || inventoryUnit === 'litros')) {
          stockConverted = ingredientStock * 1000
        } else if (recipeUnit === 'l' && (inventoryUnit === 'ml' || inventoryUnit === 'mililitro' || inventoryUnit === 'mililitros')) {
          stockConverted = ingredientStock / 1000
        } else if (recipeUnit === 'gr' && (inventoryUnit === 'kg' || inventoryUnit === 'kilogramo' || inventoryUnit === 'kilogramos')) {
          stockConverted = ingredientStock * 1000
        } else if (recipeUnit === 'kg' && (inventoryUnit === 'gr' || inventoryUnit === 'gramo' || inventoryUnit === 'gramos')) {
          stockConverted = ingredientStock / 1000
        }
        
        if (requiredConverted > 0) {
          availableCount = Math.floor(stockConverted / requiredConverted)
        } else {
          availableCount = stockConverted > 0 ? Infinity : 0
        }
      }

      availabilities.push(availableCount)

      // Identificar el ingrediente limitante (el que permite menos preparaciones)
      if (!limitingIngredient || availableCount < (limitingIngredient.stock / limitingIngredient.required)) {
        limitingIngredient = {
          productId: inventoryItem.id,
          productName: inventoryItem.name,
          stock: ingredientStock,
          required: ingredient.quantity
        }
      }
    }

    // La disponibilidad es el mínimo de todas las disponibilidades
    const available = availabilities.length > 0 ? Math.min(...availabilities) : 0
    
    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Stock] Disponibilidad calculada para ${product.name}:`, {
        available: Math.floor(available),
        availabilities,
        limitingIngredient: limitingIngredient?.productName,
        recipeIngredients: recipe.ingredients.length
      })
    }

    return {
      available: Math.max(0, Math.floor(available)), // Redondear hacia abajo (FLOOR), mínimo 0
      limitingIngredient,
      status: available > 0 ? 'available' : 'no-ingredients'
    }
  } catch (error) {
    console.error('[Stock] Error calculando disponibilidad:', error)
    return {
      available: 0,
      status: 'no-recipe'
    }
  }
}

/**
 * Calcula botellas completas disponibles para licores
 * botellas = FLOOR(stock_ml / capacidad_botella_ml)
 */
export async function calculateFullBottles(product: Product): Promise<number | undefined> {
  // Solo para licores (categorías relacionadas con licores)
  const liquorCategories = ['vodka', 'ginebra', 'tequila', 'whisky', 'vino']
  if (!liquorCategories.includes(product.category)) {
    return undefined
  }

  try {
    const stock = await calculateProductStock(product)
    
    // Buscar capacidad de botella en el producto o inventario
    const inventory = await getInventory()
    const inventoryItem = inventory.find(item => {
      const normalizedProductName = normalizeName(product.name)
      const normalizedItemName = normalizeName(item.name || '')
      return normalizedItemName === normalizedProductName ||
             normalizedItemName.includes(normalizedProductName) ||
             normalizedProductName.includes(normalizedItemName)
    })

    // Capacidad de botella (ml)
    let bottleCapacityMl = 750 // Default: 750ml (tamaño estándar)
    
    // Intentar obtener de metadata del producto (bottleSizeMl o capacityMl)
    // Por ahora, usar valor por defecto hasta que se implemente el campo
    
    // Si tenemos el inventario item, podríamos tener metadata allí
    // Por ahora, usar 750ml como default
    
    // Calcular botellas completas
    if (product.category === 'vino' || inventoryItem?.unit === 'ml') {
      // Convertir stock a ml si está en otra unidad
      const stockMl = inventoryItem?.unit === 'ml' ? stock : (stock * 1000) // Asumir litros si no es ml
      return Math.floor(stockMl / bottleCapacityMl)
    }

    return undefined
  } catch (error) {
    console.error('[Stock] Error calculando botellas completas:', error)
    return undefined
  }
}

/**
 * Obtiene información completa de stock para un producto
 */
export async function getProductStockInfo(product: Product): Promise<ProductStockInfo> {
  const stock = await calculateProductStock(product)
  const hasDirectStock = product.stock !== undefined && product.stock !== null
  
  // Verificar si es cóctel o café
  const isRecipeProduct = product.category === 'coctel' || 
                          product.category === 'cafe-caliente' || 
                          product.category === 'cafe-frio'

  let recipe: Recipe | undefined
  let availability: ProductAvailability | undefined
  let fullBottles: number | undefined

  if (isRecipeProduct) {
    // Obtener receta
    try {
      recipe = await getRecipeByProductId(product.id) || undefined
      
      // Calcular disponibilidad solo si hay receta
      if (recipe) {
        availability = await calculateProductAvailability(product, recipe)
      } else {
        // Si es cóctel/café pero no tiene receta, marcar como sin receta
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Stock] Producto ${product.name} (${product.id}) es ${product.category} pero no tiene receta`)
        }
      }
    } catch (error) {
      console.error(`[Stock] Error obteniendo receta para ${product.name}:`, error)
    }
  } else {
    // Para licores, calcular botellas completas
    fullBottles = await calculateFullBottles(product)
  }

  return {
    product,
    stock,
    hasDirectStock,
    availability: availability?.available,
    fullBottles,
    hasRecipe: !!recipe,
    recipe
  }
}

/**
 * Obtiene información de stock para múltiples productos
 */
export async function getProductsWithStock(products: Product[]): Promise<ProductStockInfo[]> {
  const stockInfoPromises = products.map(product => getProductStockInfo(product))
  return Promise.all(stockInfoPromises)
}

/**
 * Helper para normalizar nombres (eliminar acentos, espacios, etc.)
 */
function normalizeName(name: string): string {
  if (!name) return ''
  return name
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
    .replace(/\s+/g, ' ') // Normalizar espacios
}
