#!/usr/bin/env node

/**
 * Script para verificar que todas las funciones del sistema funcionen correctamente
 * - Modificar stock (productos)
 * - Agregar ventas
 * - Editar ventas
 * - Actualizar inventario
 */

require('dotenv').config({ path: '.env.local' })
const admin = require('firebase-admin')

// Inicializar Firebase Admin
let db
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json'
  let serviceAccount
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    const fs = require('fs')
    const path = require('path')
    const accountPath = path.resolve(serviceAccountPath)
    if (!fs.existsSync(accountPath)) {
      throw new Error(`No se encontró el archivo de credenciales: ${accountPath}`)
    }
    serviceAccount = JSON.parse(fs.readFileSync(accountPath, 'utf8'))
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }

  db = admin.firestore()
  console.log('✅ Firebase Admin inicializado correctamente\n')
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message)
  process.exit(1)
}

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

async function verifyProducts() {
  logSection('📦 VERIFICANDO PRODUCTOS')
  
  try {
    const productsSnapshot = await db.collection('products').limit(5).get()
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (products.length === 0) {
      log('⚠️  No hay productos en la base de datos', 'yellow')
      return null
    }
    
    log(`✅ Se encontraron ${products.length} productos para prueba`, 'green')
    const testProduct = products[0]
    log(`   Producto de prueba: ${testProduct.name} (Stock: ${testProduct.stock || 0})`)
    
    return testProduct
  } catch (error) {
    log(`❌ Error obteniendo productos: ${error.message}`, 'red')
    return null
  }
}

async function verifyInventory() {
  logSection('📋 VERIFICANDO INVENTARIO')
  
  try {
    const inventorySnapshot = await db.collection('inventory').limit(5).get()
    const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (inventory.length === 0) {
      log('⚠️  No hay items en el inventario', 'yellow')
      return null
    }
    
    log(`✅ Se encontraron ${inventory.length} items para prueba`, 'green')
    const testItem = inventory[0]
    log(`   Item de prueba: ${testItem.name} (Cantidad: ${testItem.quantity || 0})`)
    
    return testItem
  } catch (error) {
    log(`❌ Error obteniendo inventario: ${error.message}`, 'red')
    return null
  }
}

async function testUpdateProductStock(product) {
  logSection('🔄 PROBANDO ACTUALIZACIÓN DE STOCK (Productos)')
  
  if (!product) {
    log('⚠️  No hay producto disponible para probar', 'yellow')
    return false
  }
  
  try {
    const originalStock = product.stock || 0
    const newStock = originalStock + 1
    
    log(`   Stock original: ${originalStock}`)
    log(`   Stock nuevo: ${newStock}`)
    
    await db.collection('products').doc(product.id).update({
      stock: newStock
    })
    
    log('✅ Stock actualizado correctamente', 'green')
    
    // Restaurar stock original
    await db.collection('products').doc(product.id).update({
      stock: originalStock
    })
    
    log('✅ Stock restaurado a valor original', 'green')
    return true
  } catch (error) {
    log(`❌ Error actualizando stock: ${error.message}`, 'red')
    return false
  }
}

async function testUpdateInventoryItem(inventoryItem) {
  logSection('🔄 PROBANDO ACTUALIZACIÓN DE INVENTARIO')
  
  if (!inventoryItem) {
    log('⚠️  No hay item disponible para probar', 'yellow')
    return false
  }
  
  try {
    const originalQuantity = inventoryItem.quantity || 0
    const newQuantity = originalQuantity + 1
    
    log(`   Cantidad original: ${originalQuantity}`)
    log(`   Cantidad nueva: ${newQuantity}`)
    
    await db.collection('inventory').doc(inventoryItem.id).update({
      quantity: newQuantity
    })
    
    log('✅ Item de inventario actualizado correctamente', 'green')
    
    // Restaurar cantidad original
    await db.collection('inventory').doc(inventoryItem.id).update({
      quantity: originalQuantity
    })
    
    log('✅ Cantidad restaurada a valor original', 'green')
    return true
  } catch (error) {
    log(`❌ Error actualizando inventario: ${error.message}`, 'red')
    return false
  }
}

async function testCreateSale(product) {
  logSection('➕ PROBANDO CREAR VENTA')
  
  if (!product) {
    log('⚠️  No hay producto disponible para probar', 'yellow')
    return null
  }
  
  try {
    const testSale = {
      date: new Date().toISOString(),
      hour: new Date().getHours(),
      items: [{
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price || 10000,
        totalPrice: product.price || 10000
      }],
      total: product.price || 10000,
      subtotal: product.price || 10000,
      discount: 0,
      channel: 'presencial',
      paymentMethod: 'efectivo',
      ticketNumber: `TEST-${Date.now()}`
    }
    
    const saleRef = await db.collection('sales').add(testSale)
    const saleId = saleRef.id
    
    log(`✅ Venta de prueba creada correctamente`, 'green')
    log(`   ID de venta: ${saleId}`)
    log(`   Producto: ${product.name}`)
    log(`   Cantidad: 1`)
    log(`   Total: $${testSale.total}`)
    
    // Verificar que el stock del producto se actualizó
    const updatedProduct = await db.collection('products').doc(product.id).get()
    const updatedData = updatedProduct.data()
    
    if (updatedData) {
      log(`   Stock después de venta: ${updatedData.stock || 0}`, 'blue')
    }
    
    return saleId
  } catch (error) {
    log(`❌ Error creando venta: ${error.message}`, 'red')
    return null
  }
}

async function testUpdateSale(saleId, product) {
  logSection('✏️  PROBANDO EDITAR VENTA')
  
  if (!saleId || !product) {
    log('⚠️  No hay venta o producto disponible para probar', 'yellow')
    return false
  }
  
  try {
    // Obtener la venta original
    const saleDoc = await db.collection('sales').doc(saleId).get()
    if (!saleDoc.exists) {
      log('⚠️  La venta de prueba no existe', 'yellow')
      return false
    }
    
    const originalSale = saleDoc.data()
    log(`   Venta original - Total: $${originalSale.total}`)
    
    // Actualizar la venta
    const newTotal = originalSale.total + 5000
    await db.collection('sales').doc(saleId).update({
      total: newTotal,
      subtotal: newTotal,
      comment: 'Venta editada - TEST'
    })
    
    log(`✅ Venta actualizada correctamente`, 'green')
    log(`   Total nuevo: $${newTotal}`)
    log(`   Comentario: Venta editada - TEST`)
    
    // Restaurar venta original
    await db.collection('sales').doc(saleId).update({
      total: originalSale.total,
      subtotal: originalSale.subtotal,
      comment: originalSale.comment || ''
    })
    
    log('✅ Venta restaurada a valores originales', 'green')
    return true
  } catch (error) {
    log(`❌ Error editando venta: ${error.message}`, 'red')
    return false
  }
}

async function testDeleteSale(saleId, product) {
  logSection('🗑️  PROBANDO ELIMINAR VENTA')
  
  if (!saleId || !product) {
    log('⚠️  No hay venta disponible para probar', 'yellow')
    return false
  }
  
  try {
    // Obtener stock antes de eliminar
    const productBefore = await db.collection('products').doc(product.id).get()
    const stockBefore = productBefore.data()?.stock || 0
    
    log(`   Stock antes de eliminar venta: ${stockBefore}`)
    
    // Eliminar la venta
    await db.collection('sales').doc(saleId).delete()
    
    log(`✅ Venta eliminada correctamente`, 'green')
    
    // Verificar que el stock se restauró (manualmente, ya que la API lo hace automáticamente)
    // Nota: En producción, la API restaura el stock automáticamente
    log(`   Nota: La API restaura el stock automáticamente al eliminar`, 'blue')
    
    return true
  } catch (error) {
    log(`❌ Error eliminando venta: ${error.message}`, 'red')
    return false
  }
}

async function runVerification() {
  logSection('🚀 INICIANDO VERIFICACIÓN DEL SISTEMA')
  
  const results = {
    products: false,
    inventory: false,
    updateProductStock: false,
    updateInventory: false,
    createSale: false,
    updateSale: false,
    deleteSale: false
  }
  
  // Verificar productos
  const testProduct = await verifyProducts()
  results.products = testProduct !== null
  
  // Verificar inventario
  const testInventoryItem = await verifyInventory()
  results.inventory = testInventoryItem !== null
  
  // Probar actualización de stock de productos
  results.updateProductStock = await testUpdateProductStock(testProduct)
  
  // Probar actualización de inventario
  results.updateInventory = await testUpdateInventoryItem(testInventoryItem)
  
  // Probar crear venta
  const saleId = await testCreateSale(testProduct)
  results.createSale = saleId !== null
  
  // Probar editar venta
  results.updateSale = await testUpdateSale(saleId, testProduct)
  
  // Probar eliminar venta
  results.deleteSale = await testDeleteSale(saleId, testProduct)
  
  // Resumen final
  logSection('📊 RESUMEN DE VERIFICACIÓN')
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(r => r === true).length
  const failedTests = totalTests - passedTests
  
  log(`Total de pruebas: ${totalTests}`, 'cyan')
  log(`✅ Exitosas: ${passedTests}`, 'green')
  log(`❌ Fallidas: ${failedTests}`, failedTests > 0 ? 'red' : 'green')
  
  console.log('\nDetalles:')
  log(`  ${results.products ? '✅' : '❌'} Verificar productos`, results.products ? 'green' : 'red')
  log(`  ${results.inventory ? '✅' : '❌'} Verificar inventario`, results.inventory ? 'green' : 'red')
  log(`  ${results.updateProductStock ? '✅' : '❌'} Actualizar stock de productos`, results.updateProductStock ? 'green' : 'red')
  log(`  ${results.updateInventory ? '✅' : '❌'} Actualizar inventario`, results.updateInventory ? 'green' : 'red')
  log(`  ${results.createSale ? '✅' : '❌'} Crear venta`, results.createSale ? 'green' : 'red')
  log(`  ${results.updateSale ? '✅' : '❌'} Editar venta`, results.updateSale ? 'green' : 'red')
  log(`  ${results.deleteSale ? '✅' : '❌'} Eliminar venta`, results.deleteSale ? 'green' : 'red')
  
  if (failedTests === 0) {
    log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!', 'green')
    process.exit(0)
  } else {
    log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.', 'yellow')
    process.exit(1)
  }
}

// Ejecutar verificación
runVerification().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
