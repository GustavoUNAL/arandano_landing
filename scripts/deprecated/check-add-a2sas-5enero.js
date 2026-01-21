#!/usr/bin/env node

/**
 * Script para verificar y agregar lote de A2 SAS (5 de enero de 2026)
 * 
 * Uso: node scripts/check-add-a2sas-5enero.js
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

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función para normalizar nombre
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .trim()
}

// Función para buscar coincidencia de nombre
function matchesName(searchName, itemName) {
  const normalizedSearch = normalizeName(searchName)
  const normalizedItem = normalizeName(itemName)
  
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2)
  const itemWords = normalizedItem.split(/\s+/)
  
  return searchWords.every(word => 
    itemWords.some(itemWord => itemWord.includes(word) || word.includes(itemWord))
  )
}

// Items del lote de A2 SAS
const a2sasItems = [
  {
    name: 'Tapper pequeño x 330 U',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2200,
    totalValue: 2200
  },
  {
    name: 'Tapper pequeño x 330 U',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2200,
    totalValue: 2200
  },
  {
    name: 'Tapper pequeño x 330 U',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2200,
    totalValue: 2200
  }
]

const PURCHASE_DATE = '2026-01-05'
const SUPPLIER = 'Grupo Empresarial A2 SAS'
const lotNumber = `A2SAS-${PURCHASE_DATE.replace(/-/g, '')}-001`

// Función principal
async function checkAndAddA2SASLot() {
  console.log('\n🔍 VERIFICANDO Y AGREGANDO LOTE DE A2 SAS (5 DE ENERO DE 2026)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: 5 de enero de 2026 (${PURCHASE_DATE})`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    // Obtener todos los items del inventario con esta fecha y proveedor
    const inventorySnapshot = await db.collection('inventory')
      .where('purchaseDate', '==', PURCHASE_DATE)
      .get()
    
    const inventoryItems = []
    inventorySnapshot.forEach(doc => {
      const data = doc.data()
      const supplier = (data.supplier || '').toLowerCase()
      if (supplier.includes('a2') || supplier.includes('a2 sas') || supplier.includes('empresarial')) {
        inventoryItems.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    console.log(`📥 Verificando items en la base de datos...\n`)
    console.log(`   Se encontraron ${inventoryItems.length} items del proveedor A2 SAS en la fecha ${PURCHASE_DATE}\n`)
    
    // Verificar cada item del lote esperado
    let foundCount = 0
    let missingCount = 0
    
    // Contar cuántos "Tapper pequeño x 330 U" hay en el lote del 5 de enero
    const tapperItems = inventoryItems.filter(item => 
      matchesName('Tapper pequeño x 330 U', item.name)
    )
    
    console.log('═'.repeat(80))
    console.log('📋 VERIFICACIÓN DE ITEMS')
    console.log('═'.repeat(80))
    
    if (tapperItems.length >= 3) {
      console.log(`\n✅ Tapper pequeño x 330 U`)
      console.log(`   Ya están registrados: ${tapperItems.length} unidades`)
      console.log(`   Esperados: 3 unidades`)
      
      tapperItems.forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.name}`)
        console.log(`      ID: ${item.id}`)
        console.log(`      Cantidad: ${item.quantity} ${item.unit || 'Unidad'}`)
        console.log(`      Precio: ${formatCurrency(item.unitPrice || 0)}`)
        console.log(`      Total: ${formatCurrency(item.totalValue || 0)}`)
        console.log(`      Lote: ${item.lot || 'Sin lote'}`)
        console.log(`      Proveedor: ${item.supplier || 'N/A'}`)
      })
      
      if (tapperItems.length >= 3) {
        foundCount = 3
        missingCount = 0
        console.log(`\n   ✓ Los 3 items ya están registrados en el lote del 5 de enero`)
      } else {
        foundCount = tapperItems.length
        missingCount = 3 - tapperItems.length
        console.log(`\n   ⚠️  Faltan ${missingCount} unidades para completar el lote`)
      }
    } else {
      console.log(`\n⚠️  Tapper pequeño x 330 U`)
      console.log(`   Encontrados: ${tapperItems.length} unidades`)
      console.log(`   Esperados: 3 unidades`)
      foundCount = tapperItems.length
      missingCount = 3 - tapperItems.length
      
      if (tapperItems.length > 0) {
        console.log(`\n   Items encontrados en otras fechas/proveedores:`)
        tapperItems.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name}`)
          console.log(`      Fecha: ${item.purchaseDate || 'N/A'}`)
          console.log(`      Proveedor: ${item.supplier || 'N/A'}`)
          console.log(`      Precio: ${formatCurrency(item.unitPrice || 0)}`)
        })
      }
      
      console.log(`\n   ❌ Faltan ${missingCount} unidades del lote del 5 de enero`)
    }
    
    // Si faltan items, agregarlos
    if (missingCount > 0) {
      console.log('\n' + '═'.repeat(80))
      console.log('📦 AGREGANDO ITEMS FALTANTES')
      console.log('═'.repeat(80))
      
      let totalValue = 0
      let successCount = 0
      let errorCount = 0
      
      // Agregar solo los que faltan
      for (let i = 0; i < missingCount; i++) {
        const item = {
          name: 'Tapper pequeño x 330 U',
          category: 'desechables',
          quantity: 1,
          unit: 'Unidad',
          unitPrice: 2200,
          totalValue: 2200
        }
        
        totalValue += item.totalValue
        
        try {
          const itemData = {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalValue: item.totalValue,
            supplier: SUPPLIER,
            purchaseDate: PURCHASE_DATE,
            lot: lotNumber,
            notes: `Comprado en ${SUPPLIER} el 5 de enero de 2026`
          }
          
          const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          await db.collection('inventory').doc(itemId).set(itemData)
          
          console.log(`   ✅ ${item.name} (unidad ${i + 1}) agregado correctamente`)
          successCount++
          
          // Pequeño delay para evitar problemas con timestamps
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          console.error(`   ❌ Error agregando ${item.name}:`, error.message)
          errorCount++
        }
      }
      
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN FINAL')
      console.log('═'.repeat(80))
      console.log(`\n✅ Items ya registrados: ${foundCount}`)
      console.log(`✅ Items agregados: ${successCount}`)
      if (errorCount > 0) {
        console.log(`❌ Items con error: ${errorCount}`)
      }
      console.log(`💰 Valor total de items agregados: ${formatCurrency(totalValue)}`)
      console.log(`💰 Valor total del lote completo: ${formatCurrency(6600)}`)
      console.log(`🏷️  Número de lote: ${lotNumber}`)
      
    } else {
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN')
      console.log('═'.repeat(80))
      console.log(`\n✅ Todos los items ya están registrados`)
      console.log(`📦 Total de items en el lote: ${foundCount}/3`)
      console.log(`💰 Valor total del lote: ${formatCurrency(6600)}`)
      console.log(`🏷️  Número de lote: ${lotNumber}`)
      console.log(`\n✅ No se requiere agregar items adicionales`)
    }
    
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
checkAndAddA2SASLot()
