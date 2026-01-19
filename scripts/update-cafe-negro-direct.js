/**
 * Script para actualizar la receta de Café negro directamente en Firebase
 * Agrega todos los tipos de café disponibles en el inventario
 */

const admin = require('firebase-admin')
const path = require('path')

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json')
const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function getAllCafes() {
  try {
    const snapshot = await db.collection('inventory').get()
    const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
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
    console.error('Error obteniendo inventario:', error)
    return []
  }
}

async function updateCafeNegroRecipe() {
  try {
    console.log('\n☕ Actualizando receta de Café negro artesanal...\n')
    
    // 1. Buscar la receta por productId
    console.log('📋 Buscando receta...')
    const recipeSnapshot = await db.collection('recipes')
      .where('productId', '==', 'cafe-negro')
      .limit(1)
      .get()
    
    if (recipeSnapshot.empty) {
      console.error('❌ No se encontró la receta de Café negro artesanal')
      return
    }
    
    const recipeDoc = recipeSnapshot.docs[0]
    const recipe = { id: recipeDoc.id, ...recipeDoc.data() }
    
    console.log(`✅ Receta encontrada: ${recipe.id}`)
    console.log(`   Producto: ${recipe.productName}`)
    console.log(`   Ingredientes actuales: ${recipe.ingredients?.length || 0}\n`)
    
    // 2. Obtener todos los cafés
    console.log('☕ Obteniendo cafés disponibles...')
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
      quantity: 10, // 10gr por taza
      unit: 'gr'
    }))
    
    // 4. Actualizar receta
    console.log('📝 Actualizando receta...')
    await recipeDoc.ref.update({
      ingredients: ingredients,
      updatedAt: new Date().toISOString()
    })
    
    console.log('✅ Receta actualizada exitosamente')
    console.log(`   Nuevos ingredientes: ${ingredients.length}`)
    ingredients.forEach(ing => {
      console.log(`     - ${ing.productName}: ${ing.quantity} ${ing.unit}`)
    })
    console.log('')
    
  } catch (error) {
    console.error('❌ Error actualizando receta:', error)
    process.exit(1)
  }
}

updateCafeNegroRecipe().then(() => {
  console.log('✅ Proceso completado\n')
  process.exit(0)
})
