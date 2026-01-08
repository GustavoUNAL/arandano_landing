#!/usr/bin/env node

/**
 * Script para corregir items sin proveedor en la base de datos
 * 
 * Uso: node scripts/fix-missing-suppliers.js
 */

require('dotenv').config({ path: '.env.local' })

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Inicializar Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    let serviceAccount
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (error) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', error.message)
        process.exit(1)
      }
    }
    
    if (!serviceAccount) {
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), '..', 'firebase-service-account.json'),
        path.join(__dirname, '..', 'firebase-service-account.json'),
      ]
      
      for (const accountPath of possiblePaths) {
        if (fs.existsSync(accountPath)) {
          try {
            const fileContent = fs.readFileSync(accountPath, 'utf8')
            serviceAccount = JSON.parse(fileContent)
            break
          } catch (error) {
            console.error(`Error leyendo ${accountPath}:`, error.message)
          }
        }
      }
    }
    
    if (!serviceAccount) {
      console.error('❌ Error: Firebase Service Account no encontrado')
      process.exit(1)
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }
  
  return admin.firestore()
}

// Función principal
async function fixMissingSuppliers() {
  console.log('\n🔧 CORRIGIENDO ITEMS SIN PROVEEDOR\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    // Obtener todos los items de inventario
    console.log('\n📥 Obteniendo items de inventario...\n')
    const inventorySnapshot = await db.collection('inventory').get()
    
    const itemsWithoutSupplier = []
    inventorySnapshot.forEach(doc => {
      const data = doc.data()
      if (!data.supplier || data.supplier === 'Sin proveedor' || data.supplier.trim() === '') {
        itemsWithoutSupplier.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    console.log(`✅ Se encontraron ${itemsWithoutSupplier.length} items sin proveedor\n`)
    
    if (itemsWithoutSupplier.length === 0) {
      console.log('✅ Todos los items ya tienen proveedor asignado\n')
      return
    }
    
    // Agrupar por fecha y lote para inferir proveedor
    console.log('📋 Analizando items para inferir proveedor...\n')
    
    // Obtener items con proveedor para ver patrones
    const allItemsSnapshot = await db.collection('inventory').get()
    const itemsWithSupplier = []
    allItemsSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.supplier && data.supplier !== 'Sin proveedor' && data.supplier.trim() !== '') {
        itemsWithSupplier.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    // Crear mapa de lotes a proveedores
    const lotToSupplier = {}
    itemsWithSupplier.forEach(item => {
      if (item.lot && item.supplier) {
        lotToSupplier[item.lot] = item.supplier
      }
    })
    
    // Crear mapa de fechas a proveedores (para items del mismo lote)
    const dateLotToSupplier = {}
    itemsWithSupplier.forEach(item => {
      if (item.purchaseDate && item.lot && item.supplier) {
        const key = `${item.purchaseDate}_${item.lot}`
        dateLotToSupplier[key] = item.supplier
      }
    })
    
    let fixedCount = 0
    let notFixedCount = 0
    
    console.log('═'.repeat(80))
    console.log('🔧 CORRIGIENDO ITEMS')
    console.log('═'.repeat(80))
    
    for (const item of itemsWithoutSupplier) {
      let supplier = null
      
      // Intentar inferir proveedor del lote
      if (item.lot && lotToSupplier[item.lot]) {
        supplier = lotToSupplier[item.lot]
      }
      
      // Intentar inferir proveedor de fecha y lote
      if (!supplier && item.purchaseDate && item.lot) {
        const key = `${item.purchaseDate}_${item.lot}`
        if (dateLotToSupplier[key]) {
          supplier = dateLotToSupplier[key]
        }
      }
      
      // Si no se puede inferir, usar "Proveedor no especificado"
      if (!supplier) {
        supplier = 'Proveedor no especificado'
      }
      
      try {
        await db.collection('inventory').doc(item.id).update({
          supplier: supplier
        })
        
        console.log(`   ✅ ${item.name || 'Sin nombre'}`)
        console.log(`      Proveedor asignado: ${supplier}`)
        if (item.lot) {
          console.log(`      Lote: ${item.lot}`)
        }
        fixedCount++
      } catch (error) {
        console.error(`   ❌ Error actualizando ${item.name || item.id}:`, error.message)
        notFixedCount++
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items corregidos: ${fixedCount}`)
    if (notFixedCount > 0) {
      console.log(`❌ Items con error: ${notFixedCount}`)
    }
    console.log(`📦 Total procesado: ${itemsWithoutSupplier.length}`)
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Proceso completado')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
fixMissingSuppliers()
