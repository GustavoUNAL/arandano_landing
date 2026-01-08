#!/usr/bin/env node

/**
 * Script para agregar lote de A2 SAS (comprado hoy)
 * 
 * Uso: node scripts/add-a2sas-lot.js
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

// Obtener fecha de hoy en formato YYYY-MM-DD
const today = new Date()
const purchaseDate = today.toISOString().split('T')[0] // Formato: YYYY-MM-DD
const lotNumber = `A2SAS-${purchaseDate.replace(/-/g, '')}-001`

// Datos del lote de A2 SAS
const a2sasLot = [
  {
    name: 'Guantes nitrilo negro',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 1500,
    totalValue: 1500,
    supplier: 'A2 SAS',
    purchaseDate: purchaseDate,
    lot: lotNumber,
    notes: `Comprado en A2 SAS el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    name: 'Tapabocas sujeción 2QY',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 500,
    totalValue: 500,
    supplier: 'A2 SAS',
    purchaseDate: purchaseDate,
    lot: lotNumber,
    notes: `Comprado en A2 SAS el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    name: 'Papel aluminio El Sol (16 m)',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 6300,
    totalValue: 6300,
    supplier: 'A2 SAS',
    purchaseDate: purchaseDate,
    lot: lotNumber,
    notes: `Comprado en A2 SAS el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    name: 'Pitillo biodegradable x 250 und',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 5400,
    totalValue: 5400,
    supplier: 'A2 SAS',
    purchaseDate: purchaseDate,
    lot: lotNumber,
    notes: `Comprado en A2 SAS el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
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
async function addA2SASLot() {
  console.log('\n📦 AGREGANDO LOTE DE A2 SAS (Comprado hoy)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} (${purchaseDate})`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    console.log('📝 Preparando items para agregar...\n')
    
    let totalValue = 0
    const addedItems = []
    
    for (const item of a2sasLot) {
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
    console.log(`🏷️  Número de lote: ${lotNumber}`)
    console.log(`📅 Fecha de compra: ${purchaseDate}`)
    console.log(`🏪 Proveedor: A2 SAS`)
    
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
addA2SASLot()
