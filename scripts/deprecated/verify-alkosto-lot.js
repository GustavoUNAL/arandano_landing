#!/usr/bin/env node

/**
 * Script para verificar que el lote de Alkosto está almacenado correctamente en Firebase
 * 
 * Uso: node scripts/verify-alkosto-lot.js
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

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función para formatear fecha
function formatDate(dateString) {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Items esperados del lote de Alkosto
const expectedItems = [
  { name: 'Vodka', category: 'licores para shots', quantity: 1, unitPrice: 70500, totalValue: 70500 },
  { name: 'Ginebra', category: 'licores para shots', quantity: 1, unitPrice: 64500, totalValue: 64500 },
  { name: 'Aguardiente Nariño', category: 'licores', quantity: 1, unitPrice: 48000, totalValue: 48000 },
  { name: 'Jamón', category: 'acompañantes', quantity: 2, unitPrice: 13000, totalValue: 26000 },
  { name: 'Queso', category: 'acompañantes', quantity: 1, unitPrice: 14000, totalValue: 14000 },
  { name: 'Tomates', category: 'acompañantes', quantity: 1, unitPrice: 4000, totalValue: 4000 }
]

const LOT_NUMBER = 'ALKOSTO-2026-01-06-001'
const PURCHASE_DATE = '2026-01-06'
const SUPPLIER = 'Alkosto'

// Función principal
async function verifyAlkostoLot() {
  console.log('\n🔍 VERIFICANDO LOTE DE ALKOSTO EN FIREBASE\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📥 Buscando lote: ${LOT_NUMBER}`)
    console.log(`   Fecha de compra: ${PURCHASE_DATE}`)
    console.log(`   Proveedor: ${SUPPLIER}\n`)
    
    // Buscar items por número de lote
    const lotQuery = await db.collection('inventory')
      .where('lot', '==', LOT_NUMBER)
      .get()
    
    if (lotQuery.empty) {
      console.log('❌ No se encontraron items con el número de lote:', LOT_NUMBER)
      console.log('\n   Verificando si hay items con la fecha de compra...\n')
      
      // Buscar por fecha de compra
      const dateQuery = await db.collection('inventory')
        .where('purchaseDate', '==', PURCHASE_DATE)
        .where('supplier', '==', SUPPLIER)
        .get()
      
      if (dateQuery.empty) {
        console.log('❌ No se encontraron items con la fecha y proveedor especificados')
        console.log('   El lote no se almacenó correctamente en Firebase')
        return
      }
      
      console.log(`⚠️  Se encontraron ${dateQuery.size} items con la fecha ${PURCHASE_DATE} y proveedor ${SUPPLIER}`)
      console.log('   Pero NO tienen el número de lote asignado\n')
    } else {
      console.log(`✅ Se encontraron ${lotQuery.size} items con el número de lote: ${LOT_NUMBER}\n`)
    }
    
    // Obtener todos los items del lote
    const items = []
    const querySnapshot = lotQuery.empty 
      ? await db.collection('inventory')
          .where('purchaseDate', '==', PURCHASE_DATE)
          .where('supplier', '==', SUPPLIER)
          .get()
      : lotQuery
    
    querySnapshot.forEach(doc => {
      const data = doc.data()
      items.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log('═'.repeat(80))
    console.log('📋 DETALLE DE ITEMS ENCONTRADOS')
    console.log('═'.repeat(80))
    
    let totalValue = 0
    const foundItems = []
    const missingItems = []
    
    // Verificar cada item esperado
    for (const expected of expectedItems) {
      const found = items.find(item => 
        item.name === expected.name && 
        item.category === expected.category &&
        item.quantity === expected.quantity &&
        item.unitPrice === expected.unitPrice
      )
      
      if (found) {
        foundItems.push(found)
        totalValue += found.totalValue || 0
        
        console.log(`\n✅ ${expected.name}`)
        console.log(`   ID:           ${found.id}`)
        console.log(`   Categoría:    ${found.category}`)
        console.log(`   Cantidad:     ${found.quantity} ${found.unit || 'Unidad'}`)
        console.log(`   Precio unit.: ${formatCurrency(found.unitPrice)}`)
        console.log(`   Valor total:  ${formatCurrency(found.totalValue)}`)
        console.log(`   Proveedor:    ${found.supplier || 'N/A'}`)
        console.log(`   Fecha compra: ${found.purchaseDate || 'N/A'}`)
        console.log(`   Lote:         ${found.lot || 'N/A'}`)
        if (found.notes) {
          console.log(`   Notas:        ${found.notes}`)
        }
        
        // Verificar campos requeridos
        const checks = []
        if (found.supplier === SUPPLIER) checks.push('✓ Proveedor correcto')
        else checks.push(`✗ Proveedor incorrecto (esperado: ${SUPPLIER}, actual: ${found.supplier})`)
        
        if (found.purchaseDate === PURCHASE_DATE) checks.push('✓ Fecha correcta')
        else checks.push(`✗ Fecha incorrecta (esperado: ${PURCHASE_DATE}, actual: ${found.purchaseDate})`)
        
        if (found.lot === LOT_NUMBER) checks.push('✓ Lote correcto')
        else checks.push(`✗ Lote incorrecto o faltante (esperado: ${LOT_NUMBER}, actual: ${found.lot || 'N/A'})`)
        
        console.log(`   Verificación: ${checks.join(' | ')}`)
      } else {
        missingItems.push(expected)
        console.log(`\n❌ ${expected.name} - NO ENCONTRADO`)
        console.log(`   Esperado: ${expected.quantity} x ${formatCurrency(expected.unitPrice)} = ${formatCurrency(expected.totalValue)}`)
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN DE VERIFICACIÓN')
    console.log('═'.repeat(80))
    
    console.log(`\n✅ Items encontrados: ${foundItems.length}/${expectedItems.length}`)
    console.log(`❌ Items faltantes: ${missingItems.length}/${expectedItems.length}`)
    console.log(`💰 Valor total encontrado: ${formatCurrency(totalValue)}`)
    console.log(`💰 Valor total esperado: ${formatCurrency(227000)}`)
    
    // Verificar si hay items adicionales
    if (items.length > expectedItems.length) {
      console.log(`\n⚠️  Se encontraron ${items.length - expectedItems.length} items adicionales en la fecha ${PURCHASE_DATE}:`)
      items.forEach(item => {
        if (!expectedItems.find(e => e.name === item.name && e.category === item.category)) {
          console.log(`   - ${item.name} (${item.category})`)
        }
      })
    }
    
    // Verificación final
    console.log('\n' + '═'.repeat(80))
    if (foundItems.length === expectedItems.length && missingItems.length === 0) {
      console.log('✅ VERIFICACIÓN EXITOSA')
      console.log('═'.repeat(80))
      console.log('\n✓ Todos los items del lote de Alkosto están almacenados correctamente en Firebase')
      console.log(`✓ Número de lote: ${LOT_NUMBER}`)
      console.log(`✓ Fecha de compra: ${formatDate(PURCHASE_DATE)}`)
      console.log(`✓ Proveedor: ${SUPPLIER}`)
      console.log(`✓ Valor total: ${formatCurrency(totalValue)}`)
    } else {
      console.log('⚠️  VERIFICACIÓN INCOMPLETA')
      console.log('═'.repeat(80))
      if (missingItems.length > 0) {
        console.log('\n❌ Items faltantes:')
        missingItems.forEach(item => {
          console.log(`   - ${item.name} (${item.category})`)
        })
      }
      if (items.length < expectedItems.length) {
        console.log('\n⚠️  Algunos items del lote no se encontraron en Firebase')
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Verificación completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error verificando lote:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
verifyAlkostoLot()
