/**
 * Script para verificar productos con stock 999
 * Calcula stock real desde inventario y actualiza en Firebase
 */

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Cargar credenciales de Firebase
let db = null
let useFirebase = false

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    }
    
    db = admin.firestore()
    useFirebase = true
    console.log('✅ Firebase conectado')
  }
} catch (error) {
  console.error('❌ Error conectando a Firebase:', error.message)
  process.exit(1)
}

// Función para normalizar nombres
function normalizeName(name) {
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

// Función para obtener productos
async function getProducts() {
  if (!useFirebase || !db) {
    throw new Error('Firebase no disponible')
  }
  
  const snapshot = await db.collection('products').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Función para obtener inventario
async function getInventory() {
  if (!useFirebase || !db) {
    throw new Error('Firebase no disponible')
  }
  
  const snapshot = await db.collection('inventory').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Función para calcular stock real desde inventario
function calculateRealStock(product, inventory) {
  const normalizedProductName = normalizeName(product.name)
  let totalStock = 0

  // Buscar items en inventario que coincidan con el producto
  inventory.forEach((item) => {
    const normalizedItemName = normalizeName(item.name || '')
    
    // Comparación flexible: coincidencia exacta o que uno contenga al otro
    if (
      normalizedItemName === normalizedProductName ||
      normalizedItemName.includes(normalizedProductName) ||
      normalizedProductName.includes(normalizedItemName)
    ) {
      // Sumar la cantidad del lote
      const quantity = item.quantity || 0
      totalStock += quantity
    }
  })

  return totalStock
}

// Función para actualizar stock de producto
async function updateProductStock(productId, newStock) {
  if (!useFirebase || !db) {
    throw new Error('Firebase no disponible')
  }
  
  await db.collection('products').doc(productId).update({
    stock: newStock
  })
}

// Función principal
async function verifyAndUpdateStock() {
  try {
    console.log('📦 Obteniendo productos...')
    const products = await getProducts()
    console.log(`   Total productos: ${products.length}`)
    
    console.log('📦 Obteniendo inventario...')
    const inventory = await getInventory()
    console.log(`   Total items de inventario: ${inventory.length}`)
    
    // Filtrar productos con stock 999
    const productsWith999 = products.filter(p => p.stock === 999)
    console.log(`\n🔍 Productos con stock 999: ${productsWith999.length}`)
    
    if (productsWith999.length === 0) {
      console.log('✅ No hay productos con stock 999')
      return
    }
    
    console.log('\n📊 Verificando stock real de cada producto:\n')
    
    const updates = []
    let updated = 0
    let noInventory = 0
    let sameStock = 0
    
    for (const product of productsWith999) {
      const realStock = calculateRealStock(product, inventory)
      
      if (realStock > 0) {
        // Hay stock en inventario
        if (realStock !== 999) {
          updates.push({
            productId: product.id,
            productName: product.name,
            oldStock: 999,
            newStock: realStock
          })
          updated++
          console.log(`✓ ${product.name}`)
          console.log(`  Stock actual: 999 → Stock real: ${realStock}`)
        } else {
          sameStock++
          console.log(`= ${product.name} (mantiene 999)`)
        }
      } else {
        // No hay stock en inventario
        noInventory++
        console.log(`✗ ${product.name}`)
        console.log(`  Stock actual: 999 → Sin stock en inventario (0)`)
        
        // Actualizar a 0 si no hay inventario
        updates.push({
          productId: product.id,
          productName: product.name,
          oldStock: 999,
          newStock: 0
        })
        updated++
      }
    }
    
    console.log(`\n📈 Resumen:`)
    console.log(`   - Productos con stock 999: ${productsWith999.length}`)
    console.log(`   - Productos a actualizar: ${updates.length}`)
    console.log(`   - Con stock real > 0: ${updates.filter(u => u.newStock > 0).length}`)
    console.log(`   - Sin stock en inventario: ${noInventory}`)
    
    if (updates.length > 0) {
      console.log(`\n💾 Actualizando stock en Firebase...`)
      
      for (const update of updates) {
        try {
          await updateProductStock(update.productId, update.newStock)
          console.log(`✓ Actualizado: ${update.productName} (${update.oldStock} → ${update.newStock})`)
        } catch (error) {
          console.error(`✗ Error actualizando ${update.productName}:`, error.message)
        }
      }
      
      console.log(`\n✅ Actualización completada: ${updated} productos actualizados`)
    } else {
      console.log(`\n✅ No hay actualizaciones necesarias`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Ejecutar
verifyAndUpdateStock()
  .then(() => {
    console.log('\n✅ Proceso completado')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
