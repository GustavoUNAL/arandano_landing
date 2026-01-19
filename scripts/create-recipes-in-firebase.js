/**
 * Script para crear recetas en Firebase usando la API HTTP
 * Este script lee las recetas generadas y las crea en Firebase vía API
 */

const fs = require('fs')
const path = require('path')

const recipesPath = path.join(__dirname, '..', 'data', 'recipes-to-create.json')

// Cargar recetas a crear
const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf8'))
const recipes = recipesData.recipes || []

console.log(`\n📝 Creando ${recipes.length} recetas en Firebase...\n`)

// URL base de la API (ajustar según el entorno)
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000'

async function createRecipeInFirebase(recipe) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recipe)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const createdRecipe = await response.json()
    return { success: true, recipe: createdRecipe }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  const results = {
    success: [],
    failed: []
  }

  for (const recipe of recipes) {
    console.log(`📋 Creando receta: ${recipe.productName}`)
    
    const result = await createRecipeInFirebase(recipe)
    
    if (result.success) {
      console.log(`  ✅ Receta creada: ${result.recipe.id}`)
      results.success.push({
        productName: recipe.productName,
        recipeId: result.recipe.id
      })
    } else {
      console.log(`  ❌ Error: ${result.error}`)
      results.failed.push({
        productName: recipe.productName,
        error: result.error
      })
    }
    
    // Pequeña pausa para no sobrecargar Firebase
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📊 Resumen:`)
  console.log(`  ✅ Creadas: ${results.success.length}`)
  console.log(`  ❌ Fallidas: ${results.failed.length}\n`)

  if (results.failed.length > 0) {
    console.log(`❌ Recetas que fallaron:`)
    results.failed.forEach(item => {
      console.log(`  - ${item.productName}: ${item.error}`)
    })
    console.log('')
  }

  // Guardar resultados
  const resultsPath = path.join(__dirname, '..', 'data', 'recipes-creation-results.json')
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(results, null, 2)
  )
  
  console.log(`💾 Resultados guardados en: data/recipes-creation-results.json\n`)
}

// Ejecutar
main().catch(error => {
  console.error('Error fatal:', error)
  process.exit(1)
})
