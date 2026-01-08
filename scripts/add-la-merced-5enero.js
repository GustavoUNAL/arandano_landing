#!/usr/bin/env node

/**
 * Script para agregar lote de La Merced (5 de enero de 2026)
 * 
 * Uso: node scripts/add-la-merced-5enero.js
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
const purchaseDate = '2026-01-05'
const supplier = 'La Merced'
const lotNumber = `LAMERCED-${purchaseDate.replace(/-/g, '')}-001`

// Item del lote de La Merced
const laMercedItem = {
  name: 'Pollo frito',
  category: 'acompañantes',
  quantity: 1,
  unit: 'Unidad',
  unitPrice: 34000,
  totalValue: 34000,
  notes: `Comprado en ${supplier} el 5 de enero de 2026`
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

// Función principal
async function addLaMercedLot() {
  console.log('\n📦 AGREGANDO LOTE DE LA MERCED (5 DE ENERO DE 2026)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: 5 de enero de 2026 (${purchaseDate})`)
    console.log(`🏪 Proveedor: ${supplier}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    console.log('📝 Preparando item para agregar...\n')
    
    console.log(`   ✓ ${laMercedItem.name}`)
    console.log(`     Categoría: ${laMercedItem.category}`)
    console.log(`     Cantidad:  ${laMercedItem.quantity} ${laMercedItem.unit}`)
    console.log(`     Precio:    ${formatCurrency(laMercedItem.unitPrice)}`)
    console.log(`     Subtotal:  ${formatCurrency(laMercedItem.totalValue)}`)
    console.log(`     Lote:      ${lotNumber}`)
    console.log('')
    
    console.log(`💰 Valor total del lote: ${formatCurrency(laMercedItem.totalValue)}\n`)
    
    console.log('📥 Agregando item a Firebase...\n')
    
    try {
      const itemData = {
        name: laMercedItem.name,
        category: laMercedItem.category,
        quantity: laMercedItem.quantity,
        unit: laMercedItem.unit,
        unitPrice: laMercedItem.unitPrice,
        totalValue: laMercedItem.totalValue,
        supplier: supplier,
        purchaseDate: purchaseDate,
        lot: lotNumber,
        notes: laMercedItem.notes
      }
      
      const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await db.collection('inventory').doc(itemId).set(itemData)
      
      console.log(`   ✅ ${laMercedItem.name} agregado correctamente`)
      
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN')
      console.log('═'.repeat(80))
      console.log(`\n✅ Item agregado exitosamente`)
      console.log(`💰 Valor total del lote: ${formatCurrency(laMercedItem.totalValue)}`)
      console.log(`🏷️  Número de lote: ${lotNumber}`)
      console.log(`📅 Fecha de compra: ${purchaseDate}`)
      console.log(`🏪 Proveedor: ${supplier}`)
      console.log(`📦 Categoría: ${laMercedItem.category}`)
      
      console.log('\n' + '═'.repeat(80))
      console.log('✅ Proceso completado')
      console.log('═'.repeat(80) + '\n')
      
    } catch (error) {
      console.error(`   ❌ Error agregando ${laMercedItem.name}:`, error.message)
      throw error
    }
    
  } catch (error) {
    console.error('\n❌ Error agregando lote:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
addLaMercedLot()
