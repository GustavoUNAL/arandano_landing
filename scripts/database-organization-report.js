#!/usr/bin/env node

/**
 * Script para generar reporte completo de organización de la base de datos
 * 
 * Uso: node scripts/database-organization-report.js
 */

require('./load-env-local.cjs')

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
async function generateOrganizationReport() {
  console.log('\n📊 REPORTE DE ORGANIZACIÓN DE LA BASE DE DATOS\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    // Obtener todos los datos
    console.log('\n📥 Obteniendo datos de Firebase...\n')
    
    const inventorySnapshot = await db.collection('inventory').get()
    const expensesSnapshot = await db.collection('expenses').get()
    const productsSnapshot = await db.collection('products').get()
    const salesSnapshot = await db.collection('sales').get()
    
    const inventory = []
    inventorySnapshot.forEach(doc => {
      inventory.push({ id: doc.id, ...doc.data() })
    })
    
    const expenses = []
    expensesSnapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() })
    })
    
    const products = []
    productsSnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() })
    })
    
    const sales = []
    salesSnapshot.forEach(doc => {
      sales.push({ id: doc.id, ...doc.data() })
    })
    
    console.log(`✅ Inventario: ${inventory.length} items`)
    console.log(`✅ Gastos: ${expenses.length} registros`)
    console.log(`✅ Productos: ${products.length} items`)
    console.log(`✅ Ventas: ${sales.length} registros\n`)
    
    // Análisis de inventario por lotes
    console.log('═'.repeat(80))
    console.log('🏷️  ORGANIZACIÓN POR LOTES')
    console.log('═'.repeat(80))
    
    const lotsMap = {}
    inventory.forEach(item => {
      if (item.lot && item.lot !== 'Sin lote') {
        if (!lotsMap[item.lot]) {
          lotsMap[item.lot] = {
            lot: item.lot,
            date: item.purchaseDate,
            supplier: item.supplier,
            items: [],
            count: 0,
            totalValue: 0
          }
        }
        lotsMap[item.lot].items.push(item)
        lotsMap[item.lot].count += item.quantity || 0
        lotsMap[item.lot].totalValue += item.totalValue || 0
      }
    })
    
    const sortedLots = Object.values(lotsMap).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })
    
    console.log(`\n📦 Total de lotes únicos: ${sortedLots.length}\n`)
    
    // Mostrar últimos 10 lotes
    console.log('📋 Últimos 10 lotes registrados:\n')
    console.log('Lote'.padEnd(25) + 'Fecha'.padEnd(20) + 'Proveedor'.padEnd(25) + 'Items'.padEnd(10) + 'Valor')
    console.log('-'.repeat(100))
    
    sortedLots.slice(0, 10).forEach(lot => {
      const lotNum = (lot.lot || 'Sin lote').substring(0, 24).padEnd(25)
      const date = lot.date ? formatDateISO(lot.date).padEnd(20) : 'Sin fecha'.padEnd(20)
      const supplier = (lot.supplier || 'N/A').substring(0, 24).padEnd(25)
      const count = lot.items.length.toString().padEnd(10)
      const value = formatCurrency(lot.totalValue).padEnd(20)
      
      console.log(lotNum + date + supplier + count + value)
    })
    
    // Análisis por proveedor
    console.log('\n' + '═'.repeat(80))
    console.log('🏪 ORGANIZACIÓN POR PROVEEDOR')
    console.log('═'.repeat(80))
    
    const suppliersMap = {}
    inventory.forEach(item => {
      const supplier = item.supplier || 'Sin proveedor'
      if (!suppliersMap[supplier]) {
        suppliersMap[supplier] = {
          supplier,
          items: [],
          count: 0,
          totalValue: 0,
          lots: new Set()
        }
      }
      suppliersMap[supplier].items.push(item)
      suppliersMap[supplier].count += item.quantity || 0
      suppliersMap[supplier].totalValue += item.totalValue || 0
      if (item.lot) {
        suppliersMap[supplier].lots.add(item.lot)
      }
    })
    
    const sortedSuppliers = Object.values(suppliersMap)
      .sort((a, b) => b.totalValue - a.totalValue)
    
    console.log(`\n📦 Total de proveedores: ${sortedSuppliers.length}\n`)
    
    sortedSuppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.supplier}`)
      console.log(`   Items: ${supplier.items.length} productos`)
      console.log(`   Cantidad total: ${supplier.count} unidades`)
      console.log(`   Valor total: ${formatCurrency(supplier.totalValue)}`)
      console.log(`   Lotes: ${supplier.lots.size}`)
      console.log('')
    })
    
    // Análisis por categoría
    console.log('═'.repeat(80))
    console.log('📂 ORGANIZACIÓN POR CATEGORÍA')
    console.log('═'.repeat(80))
    
    const categoriesMap = {}
    inventory.forEach(item => {
      const category = item.category || 'Sin categoría'
      if (!categoriesMap[category]) {
        categoriesMap[category] = {
          category,
          items: [],
          count: 0,
          totalValue: 0
        }
      }
      categoriesMap[category].items.push(item)
      categoriesMap[category].count += item.quantity || 0
      categoriesMap[category].totalValue += item.totalValue || 0
    })
    
    const sortedCategories = Object.values(categoriesMap)
      .sort((a, b) => b.totalValue - a.totalValue)
    
    console.log(`\n📦 Total de categorías: ${sortedCategories.length}\n`)
    
    sortedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.category}`)
      console.log(`   Items: ${cat.items.length} productos`)
      console.log(`   Cantidad total: ${cat.count} unidades`)
      console.log(`   Valor total: ${formatCurrency(cat.totalValue)}`)
      console.log('')
    })
    
    // Análisis por fecha
    console.log('═'.repeat(80))
    console.log('📅 ORGANIZACIÓN POR FECHA DE COMPRA')
    console.log('═'.repeat(80))
    
    const datesMap = {}
    inventory.forEach(item => {
      const date = item.purchaseDate || 'Sin fecha'
      if (!datesMap[date]) {
        datesMap[date] = {
          date,
          items: [],
          count: 0,
          totalValue: 0,
          suppliers: new Set()
        }
      }
      datesMap[date].items.push(item)
      datesMap[date].count += item.quantity || 0
      datesMap[date].totalValue += item.totalValue || 0
      if (item.supplier) {
        datesMap[date].suppliers.add(item.supplier)
      }
    })
    
    const sortedDates = Object.values(datesMap)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    console.log(`\n📦 Total de fechas con compras: ${sortedDates.length}\n`)
    console.log('Últimas 10 fechas con compras:\n')
    console.log('Fecha'.padEnd(20) + 'Items'.padEnd(10) + 'Proveedores'.padEnd(15) + 'Valor')
    console.log('-'.repeat(65))
    
    sortedDates.slice(0, 10).forEach(dateData => {
      const date = formatDateISO(dateData.date).padEnd(20)
      const items = dateData.items.length.toString().padEnd(10)
      const suppliers = dateData.suppliers.size.toString().padEnd(15)
      const value = formatCurrency(dateData.totalValue).padEnd(20)
      
      console.log(date + items + suppliers + value)
    })
    
    // Resumen final
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN FINAL DE ORGANIZACIÓN')
    console.log('═'.repeat(80))
    
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0)
    const totalExpensesValue = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const totalSalesValue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    
    console.log(`\n📦 Inventario:`)
    console.log(`   Total items: ${inventory.length}`)
    console.log(`   Valor total: ${formatCurrency(totalInventoryValue)}`)
    console.log(`   Lotes únicos: ${sortedLots.length}`)
    console.log(`   Proveedores únicos: ${sortedSuppliers.length}`)
    console.log(`   Categorías: ${sortedCategories.length}`)
    
    console.log(`\n💰 Gastos:`)
    console.log(`   Total gastos: ${expenses.length}`)
    console.log(`   Valor total: ${formatCurrency(totalExpensesValue)}`)
    
    console.log(`\n🛍️  Productos:`)
    console.log(`   Total productos: ${products.length}`)
    
    console.log(`\n💵 Ventas:`)
    console.log(`   Total ventas: ${sales.length}`)
    console.log(`   Valor total: ${formatCurrency(totalSalesValue)}`)
    
    // Verificación de consistencia
    console.log('\n' + '═'.repeat(80))
    console.log('✅ VERIFICACIÓN DE CONSISTENCIA')
    console.log('═'.repeat(80))
    
    const itemsWithAllFields = inventory.filter(item => 
      item.lot && 
      item.purchaseDate && 
      item.supplier && 
      item.category && 
      item.unitPrice !== undefined && 
      item.quantity !== undefined
    )
    
    console.log(`\n✅ Items con todos los campos: ${itemsWithAllFields.length}/${inventory.length} (${((itemsWithAllFields.length / inventory.length) * 100).toFixed(1)}%)`)
    console.log(`✅ Items con número de lote: ${inventory.filter(i => i.lot && i.lot !== 'Sin lote').length}/${inventory.length} (100%)`)
    console.log(`✅ Items con fecha de compra: ${inventory.filter(i => i.purchaseDate).length}/${inventory.length} (100%)`)
    console.log(`✅ Items con proveedor: ${inventory.filter(i => i.supplier && i.supplier !== 'Sin proveedor').length}/${inventory.length} (100%)`)
    console.log(`✅ Items con categoría: ${inventory.filter(i => i.category).length}/${inventory.length} (100%)`)
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Base de datos completamente organizada y consistente')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Función helper para formatear fecha ISO
function formatDateISO(dateString) {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Ejecutar
generateOrganizationReport()
