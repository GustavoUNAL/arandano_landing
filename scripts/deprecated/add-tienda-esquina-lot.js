#!/usr/bin/env node

/**
 * Script para agregar lote de la tienda de la esquina (hoy)
 * 
 * Uso: node scripts/add-tienda-esquina-lot.js
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

// Obtener fecha de hoy en formato YYYY-MM-DD
const today = new Date()
const purchaseDate = today.toISOString().split('T')[0] // Formato: YYYY-MM-DD
const lotNumber = `TIENDA-ESQUINA-${purchaseDate.replace(/-/g, '')}-001`

// Items del lote de la tienda de la esquina
const tiendaItems = [
  {
    name: 'Limpido',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2000,
    totalValue: 2000,
    notes: `Comprado en la tienda de la esquina el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    name: 'Fabuloso',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3000,
    totalValue: 3000,
    notes: `Comprado en la tienda de la esquina el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    name: 'Papel higiénico',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2000,
    totalValue: 2000,
    notes: `Comprado en la tienda de la esquina el ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`
  }
]

const SUPPLIER = 'Tienda esquina'

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
async function addTiendaEsquinaLot() {
  console.log('\n📦 AGREGANDO LOTE DE LA TIENDA DE LA ESQUINA (Hoy)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: ${today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} (${purchaseDate})`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    console.log('📝 Preparando items para agregar...\n')
    
    let totalValue = 0
    
    for (const item of tiendaItems) {
      totalValue += item.totalValue
      
      console.log(`   ✓ ${item.name}`)
      console.log(`     Categoría: ${item.category}`)
      console.log(`     Cantidad:  ${item.quantity} ${item.unit}`)
      console.log(`     Precio:    ${formatCurrency(item.unitPrice)}`)
      console.log(`     Subtotal:  ${formatCurrency(item.totalValue)}`)
      console.log(`     Lote:      ${lotNumber}`)
      console.log('')
    }
    
    console.log(`💰 Valor total del lote: ${formatCurrency(totalValue)}\n`)
    
    console.log('📥 Agregando items a Firebase...\n')
    
    let successCount = 0
    let errorCount = 0
    
    for (const item of tiendaItems) {
      try {
        const itemData = {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue,
          supplier: SUPPLIER,
          purchaseDate: purchaseDate,
          lot: lotNumber,
          notes: item.notes
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
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`📦 Categoría: productos de limpieza / bioseguridad`)
    
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
addTiendaEsquinaLot()
