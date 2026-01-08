#!/usr/bin/env node

/**
 * Script para verificar si los cigarrillos Marlboro están registrados
 * 
 * Uso: node scripts/check-marlboro.js
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

// Función principal
async function checkMarlboro() {
  console.log('\n🔍 VERIFICANDO CIGARRILLOS MARLBORO\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log('\n📥 Buscando en inventario...\n')
    
    // Buscar en inventario por diferentes variaciones del nombre
    const searchTerms = ['marlboro', 'Marlboro', 'MARLBORO', 'cigarrillo', 'cigarrillos']
    
    const allInventory = await db.collection('inventory').get()
    const allProducts = await db.collection('products').get()
    
    const inventoryItems = []
    allInventory.forEach(doc => {
      const data = doc.data()
      const name = (data.name || '').toLowerCase()
      if (searchTerms.some(term => name.includes(term.toLowerCase()))) {
        inventoryItems.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    const productItems = []
    allProducts.forEach(doc => {
      const data = doc.data()
      const name = (data.name || '').toLowerCase()
      if (searchTerms.some(term => name.includes(term.toLowerCase()))) {
        productItems.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    const totalFound = inventoryItems.length + productItems.length
    
    if (totalFound === 0) {
      console.log('❌ No se encontraron cigarrillos Marlboro en la base de datos\n')
      console.log('📋 Se buscó por:')
      searchTerms.forEach(term => {
        console.log(`   - "${term}"`)
      })
      console.log('\n💡 Si deseas agregarlos, puedes usar un script de agregado de lote')
    } else {
      console.log(`✅ Se encontraron ${totalFound} registro(s) relacionado(s) con Marlboro:\n`)
      
      if (inventoryItems.length > 0) {
        console.log('📦 EN INVENTARIO:')
        console.log('═'.repeat(80))
        
        inventoryItems.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.name}`)
          console.log(`   ID:           ${item.id}`)
          console.log(`   Categoría:    ${item.category || 'Sin categoría'}`)
          console.log(`   Cantidad:     ${item.quantity || 0} ${item.unit || 'Unidad'}`)
          console.log(`   Precio unit.: ${item.unitPrice ? formatCurrency(item.unitPrice) : 'N/A'}`)
          console.log(`   Valor total:  ${item.totalValue ? formatCurrency(item.totalValue) : 'N/A'}`)
          console.log(`   Proveedor:    ${item.supplier || 'N/A'}`)
          console.log(`   Fecha compra: ${item.purchaseDate ? formatDate(item.purchaseDate) : 'N/A'}`)
          if (item.purchaseDate) {
            console.log(`   Fecha (ISO):  ${item.purchaseDate}`)
          }
          console.log(`   Lote:         ${item.lot || 'Sin lote'}`)
          if (item.notes) {
            console.log(`   Notas:        ${item.notes}`)
          }
        })
      }
      
      if (productItems.length > 0) {
        console.log('\n' + '═'.repeat(80))
        console.log('🛍️  EN PRODUCTOS:')
        console.log('═'.repeat(80))
        
        productItems.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.name}`)
          console.log(`   ID:           ${item.id}`)
          console.log(`   Categoría:    ${item.category || 'Sin categoría'}`)
          console.log(`   Stock:        ${item.stock || 0}`)
          console.log(`   Precio:       ${item.price ? formatCurrency(item.price) : 'N/A'}`)
          console.log(`   Costo:        ${item.cost ? formatCurrency(item.cost) : 'N/A'}`)
          if (item.purchaseDate) {
            console.log(`   Fecha compra: ${formatDate(item.purchaseDate)} (${item.purchaseDate})`)
          }
          if (item.lot) {
            console.log(`   Lote:         ${item.lot}`)
          }
          if (item.supplier) {
            console.log(`   Proveedor:    ${item.supplier}`)
          }
        })
      }
      
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN')
      console.log('═'.repeat(80))
      console.log(`\n✅ Items en inventario: ${inventoryItems.length}`)
      console.log(`✅ Items en productos: ${productItems.length}`)
      console.log(`📦 Total encontrado: ${totalFound}`)
    }
    
    // También buscar cualquier variación de cigarrillos
    console.log('\n' + '═'.repeat(80))
    console.log('🔍 BÚSQUEDA ADICIONAL: Todos los cigarrillos')
    console.log('═'.repeat(80))
    
    const allCigarettesInventory = []
    const allCigarettesProducts = []
    
    allInventory.forEach(doc => {
      const data = doc.data()
      const name = (data.name || '').toLowerCase()
      if (name.includes('cigar') || name.includes('tabaco')) {
        allCigarettesInventory.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    allProducts.forEach(doc => {
      const data = doc.data()
      const name = (data.name || '').toLowerCase()
      if (name.includes('cigar') || name.includes('tabaco')) {
        allCigarettesProducts.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    const totalCigarettes = allCigarettesInventory.length + allCigarettesProducts.length
    
    if (totalCigarettes > 0 && totalFound < totalCigarettes) {
      console.log(`\n📋 Se encontraron ${totalCigarettes} item(s) relacionado(s) con cigarrillos/tabaco:\n`)
      
      if (allCigarettesInventory.length > 0) {
        console.log('📦 En inventario:')
        allCigarettesInventory.forEach(item => {
          if (!inventoryItems.find(i => i.id === item.id)) {
            console.log(`   - ${item.name} (${item.category || 'Sin categoría'})`)
          }
        })
      }
      
      if (allCigarettesProducts.length > 0) {
        console.log('\n🛍️  En productos:')
        allCigarettesProducts.forEach(item => {
          if (!productItems.find(i => i.id === item.id)) {
            console.log(`   - ${item.name} (${item.category || 'Sin categoría'})`)
          }
        })
      }
    } else if (totalCigarettes === 0) {
      console.log('\n❌ No se encontraron otros productos relacionados con cigarrillos o tabaco')
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Verificación completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error verificando Marlboro:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
checkMarlboro()
