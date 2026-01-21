#!/usr/bin/env node

/**
 * Script para verificar cuántos items tienen lotes asignados
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

async function checkInventoryLots() {
  try {
    const db = initializeFirebase()
    
    console.log('\n🔍 VERIFICANDO LOTES EN EL INVENTARIO\n')
    console.log('═'.repeat(80))
    
    const snapshot = await db.collection('inventory').get()
    const items = []
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() })
    })
    
    console.log(`\n📦 Total de items en inventario: ${items.length}\n`)
    
    // Clasificar items
    const itemsWithLots = items.filter(item => {
      if (!item.lot) return false
      if (typeof item.lot !== 'string') return false
      const trimmedLot = item.lot.trim()
      return trimmedLot !== '' && trimmedLot !== 'sin-lote' && trimmedLot.toLowerCase() !== 'n/a'
    })
    
    const itemsWithoutLots = items.filter(item => {
      return !item.lot || 
             (typeof item.lot === 'string' && (item.lot.trim() === '' || item.lot.trim() === 'sin-lote'))
    })
    
    // Obtener lotes únicos
    const uniqueLots = Array.from(new Set(
      itemsWithLots.map(item => item.lot.trim())
    )).sort()
    
    console.log('═'.repeat(80))
    console.log('📊 ESTADÍSTICAS')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items CON lotes: ${itemsWithLots.length}`)
    console.log(`❌ Items SIN lotes: ${itemsWithoutLots.length}`)
    console.log(`🏷️  Lotes únicos encontrados: ${uniqueLots.length}\n`)
    
    if (uniqueLots.length > 0) {
      console.log('═'.repeat(80))
      console.log('📋 LISTA DE LOTES ÚNICOS')
      console.log('═'.repeat(80))
      uniqueLots.forEach((lot, index) => {
        const itemsInLot = itemsWithLots.filter(item => item.lot.trim() === lot)
        console.log(`\n${index + 1}. ${lot}`)
        console.log(`   Items en este lote: ${itemsInLot.length}`)
        if (itemsInLot.length > 0) {
          const sampleItem = itemsInLot[0]
          console.log(`   Fecha de compra: ${sampleItem.purchaseDate || 'No especificada'}`)
          console.log(`   Proveedor: ${sampleItem.supplier || 'No especificado'}`)
        }
      })
      console.log('')
    } else {
      console.log('\n⚠️  No se encontraron lotes válidos en el inventario.')
      console.log('   Esto puede significar que:')
      console.log('   - Los items no tienen lotes asignados')
      console.log('   - Los lotes están vacíos o tienen valores inválidos')
      console.log('   - Necesitas agregar lotes a los items existentes\n')
    }
    
    if (itemsWithoutLots.length > 0 && itemsWithoutLots.length <= 10) {
      console.log('═'.repeat(80))
      console.log('⚠️  ITEMS SIN LOTES (muestra de los primeros 10)')
      console.log('═'.repeat(80))
      itemsWithoutLots.slice(0, 10).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`)
        console.log(`   ID: ${item.id}`)
        console.log(`   Lote actual: ${item.lot || '(vacío)'}`)
        console.log(`   Fecha de compra: ${item.purchaseDate || 'No especificada'}`)
      })
      console.log('')
    }
    
    console.log('═'.repeat(80))
    console.log('✅ Verificación completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('❌ Error verificando lotes:', error.message)
    console.error(error)
    process.exit(1)
  }
}

checkInventoryLots()
