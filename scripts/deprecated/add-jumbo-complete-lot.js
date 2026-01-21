#!/usr/bin/env node

/**
 * Script para agregar TODOS los items del lote de Jumbo (27 de diciembre de 2025)
 * Incluye los items que se encontraron en otras fechas pero no en este lote específico
 * 
 * Uso: node scripts/add-jumbo-complete-lot.js
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

// Items del lote de Jumbo - TODOS los items
const jumboItems = [
  {
    name: 'Cerveza Heineken lata',
    category: 'cervezas',
    quantity: 1,
    unit: 'Lata',
    unitPrice: 6450,
    totalValue: 6450
  },
  {
    name: 'Gaseosa Coca-Cola 2.5L',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 15200,
    totalValue: 15200
  },
  {
    name: 'Baguette Cuisine & Co',
    category: 'acompañantes',
    quantity: 2,
    unit: 'Unidad',
    unitPrice: 12900,
    totalValue: 25800
  },
  {
    name: 'Lechuga batavia (0.458 kg)',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Kilogramo',
    unitPrice: 4580,
    totalValue: 4580
  },
  {
    name: 'Tomate chonto (0.515 kg)',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Kilogramo',
    unitPrice: 5180,
    totalValue: 5180
  },
  {
    name: 'Bolsa plástica',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 60,
    totalValue: 60
  },
  {
    name: 'Mezcla de ají',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3530,
    totalValue: 3530
  },
  {
    name: 'Queso Colanta',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 15900,
    totalValue: 15900
  },
  {
    name: 'Pan Resplandor',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 11500,
    totalValue: 11500
  },
  {
    name: 'Arándanos',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 11700,
    totalValue: 11700
  },
  {
    name: 'Cerveza Budweiser lata',
    category: 'cervezas',
    quantity: 1,
    unit: 'Lata',
    unitPrice: 5000,
    totalValue: 5000
  }
]

const PURCHASE_DATE = '2025-12-27'
const SUPPLIER = 'Jumbo'
const lotNumber = `JUMBO-${PURCHASE_DATE.replace(/-/g, '')}-001`

// Función principal
async function addJumboCompleteLot() {
  console.log('\n📦 AGREGANDO LOTE COMPLETO DE JUMBO (27 DE DICIEMBRE DE 2025)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: 27 de diciembre de 2025 (${PURCHASE_DATE})`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    // Verificar qué items ya están en este lote específico
    const existingLotSnapshot = await db.collection('inventory')
      .where('lot', '==', lotNumber)
      .get()
    
    const existingItems = []
    existingLotSnapshot.forEach(doc => {
      const data = doc.data()
      existingItems.push(data.name)
    })
    
    console.log(`📋 Items ya en el lote ${lotNumber}: ${existingItems.length}\n`)
    
    // Filtrar items que ya están en el lote
    const itemsToAdd = jumboItems.filter(item => !existingItems.includes(item.name))
    
    if (itemsToAdd.length === 0) {
      console.log('✅ Todos los items del lote ya están registrados\n')
      return
    }
    
    console.log(`📝 Preparando ${itemsToAdd.length} items para agregar...\n`)
    
    let totalValue = 0
    
    // Agrupar por categoría
    const byCategory = {}
    
    for (const item of itemsToAdd) {
      totalValue += item.totalValue
      
      if (!byCategory[item.category]) {
        byCategory[item.category] = { items: [], total: 0, count: 0 }
      }
      byCategory[item.category].items.push(item.name)
      byCategory[item.category].total += item.totalValue
      byCategory[item.category].count += item.quantity
      
      console.log(`   ✓ ${item.name}`)
      console.log(`     Categoría: ${item.category}`)
      console.log(`     Cantidad:  ${item.quantity} ${item.unit}`)
      console.log(`     Precio:    ${formatCurrency(item.unitPrice)}`)
      console.log(`     Subtotal:  ${formatCurrency(item.totalValue)}`)
      console.log('')
    }
    
    console.log(`💰 Valor total a agregar: ${formatCurrency(totalValue)}\n`)
    
    console.log('📥 Agregando items a Firebase...\n')
    
    let successCount = 0
    let errorCount = 0
    
    for (const item of itemsToAdd) {
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
          notes: `Comprado en ${SUPPLIER} el 27 de diciembre de 2025`
        }
        
        const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await db.collection('inventory').doc(itemId).set(itemData)
        
        console.log(`   ✅ ${item.name} agregado correctamente`)
        successCount++
        
        // Pequeño delay para evitar problemas con timestamps
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`   ❌ Error agregando ${item.name}:`, error.message)
        errorCount++
      }
    }
    
    // Calcular total del lote completo
    const allLotItems = jumboItems
    const totalLotValue = allLotItems.reduce((sum, item) => sum + item.totalValue, 0)
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN FINAL')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items ya en el lote: ${existingItems.length}`)
    console.log(`✅ Items agregados: ${successCount}`)
    if (errorCount > 0) {
      console.log(`❌ Items con error: ${errorCount}`)
    }
    console.log(`📦 Total de items en el lote: ${existingItems.length + successCount}/11`)
    console.log(`💰 Valor total del lote completo: ${formatCurrency(totalLotValue)}`)
    console.log(`🏷️  Número de lote: ${lotNumber}`)
    console.log(`📅 Fecha de compra: ${PURCHASE_DATE}`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    
    console.log('\n📂 Resumen por categoría:')
    Object.keys(byCategory).forEach(cat => {
      const catData = byCategory[cat]
      console.log(`   ${cat}: ${catData.items.length} productos, ${catData.count} unidades, ${formatCurrency(catData.total)}`)
    })
    
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
addJumboCompleteLot()
