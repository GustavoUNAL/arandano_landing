#!/usr/bin/env node

/**
 * Script para agregar los productos faltantes del lote de Paty (3 de enero de 2026)
 * 
 * Uso: node scripts/add-paty-missing-lot.js
 */

require('dotenv').config({ path: '.env.local' })

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Inicializar Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    let serviceAccount
    
    // Prioridad 1: Variable de entorno
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (error) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', error.message)
        process.exit(1)
      }
    }
    
    // Prioridad 2: Archivo
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
            console.log(`✅ Firebase Service Account encontrado en: ${accountPath}`)
            break
          } catch (error) {
            console.error(`Error leyendo ${accountPath}:`, error.message)
          }
        }
      }
    }
    
    if (!serviceAccount) {
      console.error('❌ Error: Firebase Service Account no encontrado')
      console.error('   Configura FIREBASE_SERVICE_ACCOUNT o crea firebase-service-account.json')
      process.exit(1)
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    
    console.log(`✅ Firebase conectado a proyecto: ${serviceAccount.project_id || 'unknown'}`)
  }
  
  return admin.firestore()
}

// Fecha y datos del lote
const purchaseDate = '2026-01-03'
const supplier = 'Patty'
const lotNumber = `PATY-${purchaseDate.replace(/-/g, '')}-001`

// Items faltantes del lote de Paty
const missingItems = [
  {
    name: 'Toalla higiénica Kotex tela antibacter',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3950,
    totalValue: 3950,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Cinta aislante Tesa colores 10 m',
    category: 'activos / insumos de mantenimiento',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3800,
    totalValue: 3800,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Salsa mayonesa Bary Doy Pack 200 g',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4100,
    totalValue: 4100,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Salsa de tomate Bary Doy Pack 200 g',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4100,
    totalValue: 4100,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Mezclador de bambú El Sol x 500 uds',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4900,
    totalValue: 4900,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Mostaneza Rancho La Constancia 190 g',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 6900,
    totalValue: 6900,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Festival palillos doble punta x 180 uds',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2100,
    totalValue: 2100,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  },
  {
    name: 'Ron Viejo de Caldas Tradicional 750 ml',
    category: 'licores',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 51900,
    totalValue: 51900,
    notes: `Comprado en ${supplier} el 3 de enero de 2026`
  }
]

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función principal
async function addPatyMissingLot() {
  console.log('\n📦 AGREGANDO PRODUCTOS FALTANTES DEL LOTE DE PATY\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: ${purchaseDate}`)
    console.log(`🏪 Proveedor: ${supplier}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    console.log('📝 Preparando items para agregar...\n')
    
    let totalValue = 0
    const addedItems = []
    
    // Agrupar por categoría
    const byCategory = {}
    
    for (const item of missingItems) {
      totalValue += item.totalValue
      
      const newItem = {
        ...item,
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Agrupar por categoría
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
      console.log(`     Lote:      ${lotNumber}`)
      console.log('')
      
      addedItems.push(newItem)
    }
    
    console.log(`💰 Valor total del lote: ${formatCurrency(totalValue)}\n`)
    
    // Mostrar resumen por categoría
    console.log('📂 Resumen por categoría:\n')
    Object.keys(byCategory).forEach(cat => {
      const catData = byCategory[cat]
      console.log(`   ${cat}:`)
      console.log(`     Items: ${catData.items.length} productos`)
      console.log(`     Cantidad total: ${catData.count} unidades`)
      console.log(`     Total categoría: ${formatCurrency(catData.total)}\n`)
    })
    
    console.log('📥 Agregando items a Firebase...\n')
    
    let successCount = 0
    let errorCount = 0
    
    for (const item of addedItems) {
      try {
        const itemData = {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue,
          supplier: supplier,
          purchaseDate: purchaseDate,
          lot: lotNumber,
          notes: item.notes
        }
        
        await db.collection('inventory').doc(item.id).set(itemData)
        console.log(`   ✅ ${item.name} agregado correctamente`)
        successCount++
      } catch (error) {
        console.error(`   ❌ Error agregando ${item.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items agregados exitosamente: ${successCount}`)
    if (errorCount > 0) {
      console.log(`❌ Items con error: ${errorCount}`)
    }
    console.log(`💰 Valor total del lote: ${formatCurrency(totalValue)}`)
    console.log(`🏷️  Número de lote: ${lotNumber}`)
    console.log(`📅 Fecha de compra: ${purchaseDate}`)
    console.log(`🏪 Proveedor: ${supplier}`)
    console.log(`\n📦 Desglose por categoría:`)
    Object.keys(byCategory).forEach(cat => {
      const catData = byCategory[cat]
      console.log(`   ${cat}: ${catData.items.length} productos, ${catData.count} unidades, ${formatCurrency(catData.total)}`)
    })
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Proceso completado')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error agregando lote:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
addPatyMissingLot()
