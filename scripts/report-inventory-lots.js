#!/usr/bin/env node

/**
 * Script para analizar inventario y productos - Reporte de lotes
 * 
 * Uso: node scripts/report-inventory-lots.js
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

// Función para formatear fecha ISO corta
function formatDateISO(dateString) {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Función para formatear moneda
function formatCurrency(amount) {
  if (!amount) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función principal
async function generateReport() {
  console.log('\n📊 REPORTE DE INVENTARIO - ANÁLISIS DE LOTES\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    // Obtener inventario
    console.log('\n📥 Obteniendo inventario desde Firebase...\n')
    const inventorySnapshot = await db.collection('inventory').get()
    
    const inventoryItems = []
    inventorySnapshot.forEach(doc => {
      const data = doc.data()
      inventoryItems.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log(`✅ Se encontraron ${inventoryItems.length} items de inventario\n`)
    
    // Obtener productos
    console.log('📥 Obteniendo productos desde Firebase...\n')
    const productsSnapshot = await db.collection('products').get()
    
    const products = []
    productsSnapshot.forEach(doc => {
      const data = doc.data()
      products.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log(`✅ Se encontraron ${products.length} productos\n`)
    
    // Analizar lotes del inventario
    const inventoryLots = []
    const inventoryByDate = []
    
    inventoryItems.forEach(item => {
      if (item.purchaseDate) {
        inventoryByDate.push({
          type: 'inventory',
          name: item.name || 'Sin nombre',
          category: item.category || 'Sin categoría',
          purchaseDate: item.purchaseDate,
          lot: item.lot || 'Sin lote',
          supplier: item.supplier || 'Sin proveedor',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          totalValue: item.totalValue || 0
        })
      }
      
      if (item.lot) {
        inventoryLots.push({
          type: 'inventory',
          name: item.name || 'Sin nombre',
          lot: item.lot,
          purchaseDate: item.purchaseDate || null,
          date: item.purchaseDate ? new Date(item.purchaseDate) : null
        })
      }
    })
    
    // Analizar lotes de productos
    const productLots = []
    const productsByDate = []
    
    products.forEach(product => {
      if (product.purchaseDate) {
        productsByDate.push({
          type: 'product',
          name: product.name || 'Sin nombre',
          category: product.category || 'Sin categoría',
          purchaseDate: product.purchaseDate,
          lot: product.lot || 'Sin lote',
          supplier: product.supplier || 'Sin proveedor',
          stock: product.stock || 0,
          cost: product.cost || 0
        })
      }
      
      if (product.lot) {
        productLots.push({
          type: 'product',
          name: product.name || 'Sin nombre',
          lot: product.lot,
          purchaseDate: product.purchaseDate || null,
          date: product.purchaseDate ? new Date(product.purchaseDate) : null
        })
      }
    })
    
    // Combinar todos los registros con fecha
    const allRecords = [...inventoryByDate, ...productsByDate]
    
    // Ordenar por fecha descendente
    allRecords.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
      const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
      return dateB - dateA
    })
    
    // Encontrar último registro de lote
    const lastRecord = allRecords.length > 0 ? allRecords[0] : null
    
    // Agrupar por fecha
    const recordsByDate = {}
    allRecords.forEach(record => {
      const date = record.purchaseDate ? formatDateISO(record.purchaseDate) : 'Sin fecha'
      if (!recordsByDate[date]) {
        recordsByDate[date] = []
      }
      recordsByDate[date].push(record)
    })
    
    const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
      if (a === 'Sin fecha') return 1
      if (b === 'Sin fecha') return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
    
    // REPORTE GENERAL
    console.log('═'.repeat(80))
    console.log('📈 REPORTE GENERAL DE INVENTARIO Y LOTES')
    console.log('═'.repeat(80))
    
    console.log(`\n📦 Resumen:`)
    console.log(`   Items de inventario: ${inventoryItems.length}`)
    console.log(`   Productos:          ${products.length}`)
    console.log(`   Total de registros: ${allRecords.length}`)
    
    const withDates = allRecords.filter(r => r.purchaseDate)
    const withLots = allRecords.filter(r => r.lot && r.lot !== 'Sin lote')
    
    console.log(`   Con fecha de compra: ${withDates.length}`)
    console.log(`   Con número de lote:  ${withLots.length}`)
    
    // ÚLTIMO REGISTRO DE LOTE
    console.log('\n' + '═'.repeat(80))
    console.log('📅 ÚLTIMO REGISTRO DE LOTE')
    console.log('═'.repeat(80))
    
    if (lastRecord) {
      console.log(`\n📆 Fecha del último lote registrado:`)
      console.log(`   ${formatDate(lastRecord.purchaseDate)} (${formatDateISO(lastRecord.purchaseDate)})`)
      console.log(`\n📋 Detalles del último registro:`)
      console.log(`   Tipo:      ${lastRecord.type === 'inventory' ? 'Inventario' : 'Producto'}`)
      console.log(`   Nombre:    ${lastRecord.name}`)
      console.log(`   Categoría: ${lastRecord.category}`)
      console.log(`   Lote:      ${lastRecord.lot || 'Sin lote'}`)
      console.log(`   Proveedor: ${lastRecord.supplier || 'Sin proveedor'}`)
      
      if (lastRecord.type === 'inventory') {
        console.log(`   Cantidad:  ${lastRecord.quantity} ${lastRecord.unit}`)
        console.log(`   Precio:    ${formatCurrency(lastRecord.unitPrice)}`)
        console.log(`   Valor:     ${formatCurrency(lastRecord.totalValue)}`)
      } else {
        console.log(`   Stock:     ${lastRecord.stock}`)
        console.log(`   Costo:     ${formatCurrency(lastRecord.cost)}`)
      }
    } else {
      console.log('\n⚠️  No se encontraron registros con fecha de compra')
    }
    
    // RESUMEN POR FECHA (Últimos 10 días con registros)
    if (sortedDates.length > 0 && sortedDates[0] !== 'Sin fecha') {
      console.log('\n' + '═'.repeat(80))
      console.log('📅 RESUMEN POR FECHA DE COMPRA (Últimos 10 días con registros)')
      console.log('═'.repeat(80))
      
      const last10Dates = sortedDates.filter(d => d !== 'Sin fecha').slice(0, 10)
      
      console.log('\n')
      console.log('Fecha'.padEnd(20) + 'Registros'.padEnd(15) + 'Items'.padEnd(15))
      console.log('-'.repeat(50))
      
      last10Dates.forEach(date => {
        const records = recordsByDate[date]
        const count = records.length.toString().padEnd(15)
        const items = records.map(r => r.name).join(', ')
        const itemsDisplay = items.length > 40 ? items.substring(0, 37) + '...' : items
        
        console.log(date.padEnd(20) + count + itemsDisplay.padEnd(15))
      })
    }
    
    // ANÁLISIS DE LOTES
    console.log('\n' + '═'.repeat(80))
    console.log('🏷️  ANÁLISIS DE NÚMEROS DE LOTE')
    console.log('═'.repeat(80))
    
    const allLots = [...inventoryLots, ...productLots]
    const lotsMap = {}
    
    allLots.forEach(lot => {
      if (lot.lot && lot.lot !== 'Sin lote') {
        if (!lotsMap[lot.lot]) {
          lotsMap[lot.lot] = []
        }
        lotsMap[lot.lot].push(lot)
      }
    })
    
    const uniqueLots = Object.keys(lotsMap)
    
    if (uniqueLots.length > 0) {
      console.log(`\n📊 Se encontraron ${uniqueLots.length} números de lote únicos\n`)
      
      // Mostrar últimos 10 lotes (por fecha más reciente)
      const lotsWithDates = uniqueLots.map(lotNum => {
        const items = lotsMap[lotNum]
        const withDate = items.filter(i => i.date).sort((a, b) => b.date - a.date)
        return {
          lot: lotNum,
          date: withDate.length > 0 ? withDate[0].date : null,
          items: items,
          count: items.length
        }
      }).sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date - a.date
      })
      
      console.log('Últimos 10 lotes registrados:\n')
      console.log('Lote'.padEnd(20) + 'Fecha'.padEnd(20) + 'Items'.padEnd(10) + 'Productos')
      console.log('-'.repeat(70))
      
      lotsWithDates.slice(0, 10).forEach(lotData => {
        const lotNum = lotData.lot.padEnd(20)
        const date = lotData.date ? formatDateISO(lotData.date.toISOString()).padEnd(20) : 'Sin fecha'.padEnd(20)
        const count = lotData.count.toString().padEnd(10)
        const names = lotData.items.map(i => i.name).join(', ')
        const namesDisplay = names.length > 30 ? names.substring(0, 27) + '...' : names
        
        console.log(lotNum + date + count + namesDisplay)
      })
    } else {
      console.log('\n⚠️  No se encontraron números de lote registrados')
    }
    
    // DETALLES DEL ÚLTIMO LOTE (si existe)
    if (lastRecord && lastRecord.lot && lastRecord.lot !== 'Sin lote') {
      console.log('\n' + '═'.repeat(80))
      console.log(`📦 DETALLES DEL ÚLTIMO LOTE: ${lastRecord.lot}`)
      console.log('═'.repeat(80))
      
      const lastLotItems = allRecords.filter(r => 
        r.lot === lastRecord.lot && r.purchaseDate === lastRecord.purchaseDate
      )
      
      if (lastLotItems.length > 0) {
        console.log(`\n📋 Se encontraron ${lastLotItems.length} items en este lote:\n`)
        
        lastLotItems.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name}`)
          console.log(`   Tipo:      ${item.type === 'inventory' ? 'Inventario' : 'Producto'}`)
          console.log(`   Categoría: ${item.category}`)
          if (item.supplier && item.supplier !== 'Sin proveedor') {
            console.log(`   Proveedor: ${item.supplier}`)
          }
          if (item.type === 'inventory') {
            console.log(`   Cantidad:  ${item.quantity} ${item.unit}`)
            console.log(`   Valor:     ${formatCurrency(item.totalValue)}`)
          } else {
            console.log(`   Stock:     ${item.stock}`)
            if (item.cost) {
              console.log(`   Costo:     ${formatCurrency(item.cost)}`)
            }
          }
          console.log('')
        })
      }
    }
    
    // Items sin fecha o sin lote
    const withoutDate = allRecords.filter(r => !r.purchaseDate)
    const withoutLot = allRecords.filter(r => !r.lot || r.lot === 'Sin lote')
    
    if (withoutDate.length > 0 || withoutLot.length > 0) {
      console.log('\n' + '═'.repeat(80))
      console.log('⚠️  REGISTROS INCOMPLETOS')
      console.log('═'.repeat(80))
      
      if (withoutDate.length > 0) {
        console.log(`\n📅 Items sin fecha de compra: ${withoutDate.length}`)
        if (withoutDate.length <= 10) {
          withoutDate.forEach(item => {
            console.log(`   - ${item.name} (${item.type})`)
          })
        } else {
          withoutDate.slice(0, 10).forEach(item => {
            console.log(`   - ${item.name} (${item.type})`)
          })
          console.log(`   ... y ${withoutDate.length - 10} más`)
        }
      }
      
      if (withoutLot.length > 0) {
        console.log(`\n🏷️  Items sin número de lote: ${withoutLot.length}`)
        if (withoutLot.length <= 10) {
          withoutLot.forEach(item => {
            console.log(`   - ${item.name} (${item.type}) - ${item.purchaseDate ? formatDateISO(item.purchaseDate) : 'Sin fecha'}`)
          })
        } else {
          withoutLot.slice(0, 10).forEach(item => {
            console.log(`   - ${item.name} (${item.type}) - ${item.purchaseDate ? formatDateISO(item.purchaseDate) : 'Sin fecha'}`)
          })
          console.log(`   ... y ${withoutLot.length - 10} más`)
        }
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Reporte completado')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error generando reporte:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
generateReport()
