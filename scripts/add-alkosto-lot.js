#!/usr/bin/env node

/**
 * Script para agregar lote de Alkosto del 2026-01-06
 * 
 * Uso: node scripts/add-alkosto-lot.js
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

// Datos del lote de Alkosto
const alkostoLot = [
  {
    name: 'Vodka',
    category: 'licores para shots',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 70500,
    totalValue: 70500,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
  },
  {
    name: 'Ginebra',
    category: 'licores para shots',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 64500,
    totalValue: 64500,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
  },
  {
    name: 'Aguardiente Nariño',
    category: 'licores',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 48000,
    totalValue: 48000,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
  },
  {
    name: 'Jamón',
    category: 'acompañantes',
    quantity: 2,
    unit: 'Unidad',
    unitPrice: 13000,
    totalValue: 26000,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
  },
  {
    name: 'Queso',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 14000,
    totalValue: 14000,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
  },
  {
    name: 'Tomates',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4000,
    totalValue: 4000,
    supplier: 'Alkosto',
    purchaseDate: '2026-01-06',
    lot: 'ALKOSTO-2026-01-06-001',
    notes: 'Comprado en Alkosto el 6 de enero de 2026'
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
async function addAlkostoLot() {
  console.log('\n📦 AGREGANDO LOTE DE ALKOSTO (2026-01-06)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log('\n📝 Preparando items para agregar...\n')
    
    let totalValue = 0
    const addedItems = []
    
    for (const item of alkostoLot) {
      totalValue += item.totalValue
      
      const newItem = {
        ...item,
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      console.log(`   ✓ ${item.name}`)
      console.log(`     Categoría: ${item.category}`)
      console.log(`     Cantidad:  ${item.quantity} ${item.unit}`)
      console.log(`     Precio:    ${formatCurrency(item.unitPrice)}`)
      console.log(`     Subtotal:  ${formatCurrency(item.totalValue)}`)
      console.log(`     Lote:      ${item.lot}`)
      console.log('')
      
      addedItems.push(newItem)
    }
    
    console.log(`💰 Valor total del lote: ${formatCurrency(totalValue)}\n`)
    
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
          supplier: item.supplier,
          purchaseDate: item.purchaseDate,
          lot: item.lot,
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
    console.log(`🏷️  Número de lote: ALKOSTO-2026-01-06-001`)
    console.log(`📅 Fecha de compra: 2026-01-06`)
    console.log(`🏪 Proveedor: Alkosto`)
    
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
addAlkostoLot()
