#!/usr/bin/env node

/**
 * Script para verificar el lote de Carnes del Sebastián
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

const lotNumber = 'CARNESSEBASTIAN-20260106-001'

async function verifyLot() {
  try {
    const db = initializeFirebase()
    
    console.log(`\n🔍 Verificando lote: ${lotNumber}\n`)
    console.log('═'.repeat(80))
    
    const snapshot = await db.collection('inventory')
      .where('lot', '==', lotNumber)
      .get()
    
    if (snapshot.empty) {
      console.log('⚠️  No se encontraron items con este número de lote\n')
      return
    }
    
    console.log(`\n✅ Se encontraron ${snapshot.size} item(s) en el lote\n`)
    
    const items = []
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() })
    })
    
    // Ordenar por nombre
    items.sort((a, b) => a.name.localeCompare(b.name))
    
    console.log('📦 Items encontrados:\n')
    
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`)
      console.log(`   ID: ${item.id}`)
      console.log(`   Categoría: ${item.category || 'N/A'}`)
      console.log(`   Cantidad: ${item.quantity} ${item.unit || ''}`)
      if (item.presentation) {
        console.log(`   Presentación: ${item.presentation}`)
      }
      if (item.code) {
        console.log(`   Código: ${item.code}`)
      }
      console.log(`   Precio unitario: $${item.unitPrice?.toLocaleString('es-CO') || 'N/A'}`)
      console.log(`   Valor total: $${item.totalValue?.toLocaleString('es-CO') || 'N/A'}`)
      console.log(`   Proveedor: ${item.supplier || 'N/A'}`)
      console.log(`   Fecha de compra: ${item.purchaseDate || 'N/A'}`)
      console.log(`   Lote: ${item.lot || 'N/A'}`)
      console.log('')
    })
    
    const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0)
    console.log('═'.repeat(80))
    console.log(`💰 Valor total del lote: $${totalValue.toLocaleString('es-CO')}`)
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('❌ Error verificando lote:', error.message)
    console.error(error)
    process.exit(1)
  }
}

verifyLot()
