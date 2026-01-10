#!/usr/bin/env node

/**
 * Script para agregar lote de Carnes del Sebastián (6 de enero de 2026)
 * 
 * Uso: node scripts/add-carnes-sebastian-lot.js
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
const purchaseDate = '2026-01-06'
const supplierName = 'Carnes del Sebastián'
const lotNumber = `CARNESSEBASTIAN-${purchaseDate.replace(/-/g, '')}-001`

// Items del lote de Carnes del Sebastián
const itemsToAdd = [
  {
    name: 'Jamón de cerdo sánduche',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 7650,
    totalValue: 7650,
    presentation: '450 g',
    code: '7700679062103',
    notes: `Comprado en ${supplierName} el 6 de enero de 2026. Presentación: 450 g`
  },
  {
    name: 'Queso doble crema Colácteos',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 12400,
    totalValue: 12400,
    presentation: '250 g',
    code: '1498',
    notes: `Comprado en ${supplierName} el 6 de enero de 2026. Presentación: 250 g`
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
async function addCarnesSebastianLot() {
  console.log('\n📦 AGREGANDO LOTE DE CARNES DEL SEBASTIÁN (6 DE ENERO DE 2026)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: 6 de enero de 2026 (${purchaseDate})`)
    console.log(`🏪 Proveedor: ${supplierName}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    console.log('📝 Preparando items para agregar...\n')
    
    let totalLotValue = 0
    
    itemsToAdd.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`)
      console.log(`      Categoría: ${item.category}`)
      console.log(`      Cantidad:  ${item.quantity} ${item.unit}`)
      if (item.presentation) {
        console.log(`      Presentación: ${item.presentation}`)
      }
      if (item.code) {
        console.log(`      Código: ${item.code}`)
      }
      console.log(`      Precio:    ${formatCurrency(item.unitPrice)}`)
      console.log(`      Subtotal:  ${formatCurrency(item.totalValue)}`)
      console.log(`      Lote:      ${lotNumber}`)
      console.log('')
      totalLotValue += item.totalValue
    })
    
    console.log(`💰 Valor total del lote: ${formatCurrency(totalLotValue)}\n`)
    
    console.log('📥 Agregando items a Firebase...\n')
    
    const addedItems = []
    
    for (const item of itemsToAdd) {
      try {
        const itemData = {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue,
          supplier: supplierName,
          purchaseDate: purchaseDate,
          lot: lotNumber,
          notes: item.notes
        }
        
        // Agregar campos opcionales
        if (item.presentation) {
          itemData.presentation = item.presentation
        }
        if (item.code) {
          itemData.code = item.code
        }
        
        const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await db.collection('inventory').doc(itemId).set(itemData)
        
        console.log(`   ✅ ${item.name} agregado correctamente`)
        addedItems.push(item)
        
        // Pequeña pausa para evitar conflictos de timestamp
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`   ❌ Error agregando ${item.name}:`, error.message)
        throw error
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN')
    console.log('═'.repeat(80))
    console.log(`\n✅ ${addedItems.length} item(s) agregado(s) exitosamente`)
    console.log(`💰 Valor total del lote: ${formatCurrency(totalLotValue)}`)
    console.log(`🏷️  Número de lote: ${lotNumber}`)
    console.log(`📅 Fecha de compra: ${purchaseDate}`)
    console.log(`🏪 Proveedor: ${supplierName}`)
    
    console.log('\n📦 Items agregados:')
    addedItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - ${formatCurrency(item.totalValue)}`)
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
addCarnesSebastianLot()
