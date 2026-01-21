/**
 * Script para obtener la receta actual de Café negro y actualizarla con todos los cafés disponibles
 */

const fs = require('fs')
const path = require('path')

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000'

async function getRecipe(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recipes?productId=${productId}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error obteniendo receta:', error.message)
    return null
  }
}

async function getAllCafes() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const inventory = await response.json()
    
    // Filtrar cafés (no utensilios)
    const cafes = inventory.filter(item => {
      const name = (item.name || '').toLowerCase()
      const category = (item.category || '').toLowerCase()
      
      const isCafe = (name.includes('café') || name.includes('cafe')) && 
                     (name.includes('especial') || name.includes('buesaco') || name.includes('jacoba') || 
                      name.includes('sello') || name.includes('instantáneo') || name.includes('instantaneo'))
      const isUtensil = name.includes('mug') || name.includes('pocillo') || name.includes('colador') || 
                        name.includes('termo') || name.includes('cafetera') || name.includes('bolsa')
      
      return isCafe && !isUtensil && category.includes('insumos para café')
    })
    
    return cafes
  } catch (error) {
    console.error('Error obteniendo inventario:', error.message)
    return []
  }
}

async function updateRecipe(recipeId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error actualizando receta:', error.message)
    return null
  }
}

async function main() {
  console.log('\n☕ Actualizando receta de Café negro artesanal...\n')
  
  // 1. Obtener receta actual
  console.log('📋 Obteniendo receta actual...')
  const recipe = await getRecipe('cafe-negro')
  
  if (!recipe) {
    console.error('❌ No se encontró la receta de Café negro artesanal')
    return
  }
  
  console.log(`✅ Receta encontrada: ${recipe.id}`)
  console.log(`   Producto: ${recipe.productName}`)
  console.log(`   Ingredientes actuales: ${recipe.ingredients.length}\n`)
  
  // 2. Obtener todos los cafés disponibles
  console.log('☕ Obteniendo cafés disponibles en inventario...')
  const cafes = await getAllCafes()
  
  if (cafes.length === 0) {
    console.error('❌ No se encontraron cafés en el inventario')
    return
  }
  
  console.log(`✅ ${cafes.length} tipo(s) de café encontrado(s):`)
  cafes.forEach(cafe => {
    console.log(`   - ${cafe.name}: ${cafe.quantity} ${cafe.unit}`)
  })
  console.log('')
  
  // 3. Crear ingredientes para la receta
  const ingredients = cafes.map(cafe => ({
    productId: cafe.id,
    productName: cafe.name,
    quantity: 10, // 10gr por taza (ajustable según necesidad)
    unit: 'gr'
  }))
  
  // 4. Actualizar receta
  console.log('📝 Actualizando receta...')
  const updateData = {
    productName: recipe.productName,
    category: recipe.category,
    ingredients: ingredients
  }
  
  const updatedRecipe = await updateRecipe(recipe.id, updateData)
  
  if (updatedRecipe) {
    console.log(`✅ Receta actualizada exitosamente`)
    console.log(`   Nuevos ingredientes: ${updatedRecipe.ingredients.length}`)
    updatedRecipe.ingredients.forEach(ing => {
      console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit}`)
    })
  } else {
    console.error('❌ Error al actualizar la receta')
  }
  
  console.log('')
}

main().catch(error => {
  console.error('Error fatal:', error)
  process.exit(1)
})
