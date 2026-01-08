#!/usr/bin/env node

/**
 * Script de Auditoría de Base de Datos - Verificación de Consistencia
 * 
 * Verifica:
 * - Items de inventario con números de lote
 * - Items sin lote
 * - Items sin fecha de compra
 * - Items sin proveedor
 * - Categorías correctas
 * - Gastos registrados
 * 
 * Uso: node scripts/audit-database.js
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
async function auditDatabase() {
  console.log('\n🔍 AUDITORÍA DE BASE DE DATOS - VERIFICACIÓN DE CONSISTENCIA\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log('\n📥 Obteniendo datos de Firebase...\n')
    
    // Obtener inventario
    const inventorySnapshot = await db.collection('inventory').get()
    const inventoryItems = []
    inventorySnapshot.forEach(doc => {
      const data = doc.data()
      inventoryItems.push({
        id: doc.id,
        ...data
      })
    })
    
    // Obtener productos
    const productsSnapshot = await db.collection('products').get()
    const products = []
    productsSnapshot.forEach(doc => {
      const data = doc.data()
      products.push({
        id: doc.id,
        ...data
      })
    })
    
    // Obtener gastos
    const expensesSnapshot = await db.collection('expenses').get()
    const expenses = []
    expensesSnapshot.forEach(doc => {
      const data = doc.data()
      expenses.push({
        id: doc.id,
        ...data
      })
    })
    
    // Obtener ventas
    const salesSnapshot = await db.collection('sales').get()
    const sales = []
    salesSnapshot.forEach(doc => {
      const data = doc.data()
      sales.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log(`✅ Items de inventario: ${inventoryItems.length}`)
    console.log(`✅ Productos: ${products.length}`)
    console.log(`✅ Gastos: ${expenses.length}`)
    console.log(`✅ Ventas: ${sales.length}\n`)
    
    // AUDITORÍA DE INVENTARIO
    console.log('═'.repeat(80))
    console.log('📦 AUDITORÍA DE INVENTARIO')
    console.log('═'.repeat(80))
    
    let itemsWithLot = 0
    let itemsWithoutLot = 0
    let itemsWithoutDate = 0
    let itemsWithoutSupplier = 0
    let itemsWithoutCategory = 0
    let itemsWithoutPrice = 0
    let totalInventoryValue = 0
    
    const itemsWithoutLotList = []
    const itemsWithoutDateList = []
    const itemsWithoutSupplierList = []
    
    inventoryItems.forEach(item => {
      // Verificar lote
      if (item.lot && item.lot !== 'Sin lote' && item.lot.trim() !== '') {
        itemsWithLot++
      } else {
        itemsWithoutLot++
        itemsWithoutLotList.push({
          id: item.id,
          name: item.name || 'Sin nombre',
          date: item.purchaseDate || 'Sin fecha',
          supplier: item.supplier || 'Sin proveedor'
        })
      }
      
      // Verificar fecha
      if (!item.purchaseDate || item.purchaseDate.trim() === '') {
        itemsWithoutDate++
        itemsWithoutDateList.push({
          id: item.id,
          name: item.name || 'Sin nombre',
          supplier: item.supplier || 'Sin proveedor'
        })
      }
      
      // Verificar proveedor
      if (!item.supplier || item.supplier.trim() === '') {
        itemsWithoutSupplier++
        itemsWithoutSupplierList.push({
          id: item.id,
          name: item.name || 'Sin nombre',
          date: item.purchaseDate || 'Sin fecha'
        })
      }
      
      // Verificar categoría
      if (!item.category || item.category.trim() === '') {
        itemsWithoutCategory++
      }
      
      // Verificar precio
      if (!item.unitPrice || item.unitPrice === 0) {
        itemsWithoutPrice++
      }
      
      // Calcular valor total
      totalInventoryValue += item.totalValue || 0
    })
    
    console.log(`\n📊 Estadísticas de Inventario:`)
    console.log(`   Total de items: ${inventoryItems.length}`)
    console.log(`   ✅ Con número de lote: ${itemsWithLot} (${((itemsWithLot / inventoryItems.length) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Sin número de lote: ${itemsWithoutLot} (${((itemsWithoutLot / inventoryItems.length) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Sin fecha de compra: ${itemsWithoutDate}`)
    console.log(`   ❌ Sin proveedor: ${itemsWithoutSupplier}`)
    console.log(`   ❌ Sin categoría: ${itemsWithoutCategory}`)
    console.log(`   ❌ Sin precio: ${itemsWithoutPrice}`)
    console.log(`   💰 Valor total del inventario: ${formatCurrency(totalInventoryValue)}`)
    
    // Items sin lote
    if (itemsWithoutLot > 0) {
      console.log(`\n⚠️  ITEMS SIN NÚMERO DE LOTE (${itemsWithoutLot}):`)
      console.log('-'.repeat(80))
      
      // Agrupar por fecha
      const byDate = {}
      itemsWithoutLotList.forEach(item => {
        const date = item.date === 'Sin fecha' ? 'Sin fecha' : item.date
        if (!byDate[date]) {
          byDate[date] = []
        }
        byDate[date].push(item)
      })
      
      const sortedDates = Object.keys(byDate).sort((a, b) => {
        if (a === 'Sin fecha') return 1
        if (b === 'Sin fecha') return -1
        return new Date(b).getTime() - new Date(a).getTime()
      })
      
      sortedDates.slice(0, 10).forEach(date => {
        const items = byDate[date]
        console.log(`\n📅 ${date} (${items.length} items):`)
        items.slice(0, 5).forEach(item => {
          console.log(`   - ${item.name} (${item.supplier})`)
        })
        if (items.length > 5) {
          console.log(`   ... y ${items.length - 5} más`)
        }
      })
    }
    
    // Items sin fecha
    if (itemsWithoutDate > 0) {
      console.log(`\n⚠️  ITEMS SIN FECHA DE COMPRA (${itemsWithoutDate}):`)
      itemsWithoutDateList.slice(0, 10).forEach(item => {
        console.log(`   - ${item.name} (Proveedor: ${item.supplier})`)
      })
      if (itemsWithoutDateList.length > 10) {
        console.log(`   ... y ${itemsWithoutDateList.length - 10} más`)
      }
    }
    
    // Items sin proveedor
    if (itemsWithoutSupplier > 0) {
      console.log(`\n⚠️  ITEMS SIN PROVEEDOR (${itemsWithoutSupplier}):`)
      itemsWithoutSupplierList.slice(0, 10).forEach(item => {
        console.log(`   - ${item.name} (Fecha: ${item.date})`)
      })
      if (itemsWithoutSupplierList.length > 10) {
        console.log(`   ... y ${itemsWithoutSupplierList.length - 10} más`)
      }
    }
    
    // Análisis de lotes
    console.log('\n' + '═'.repeat(80))
    console.log('🏷️  ANÁLISIS DE LOTES')
    console.log('═'.repeat(80))
    
    const lotsMap = {}
    inventoryItems.forEach(item => {
      if (item.lot && item.lot !== 'Sin lote' && item.lot.trim() !== '') {
        if (!lotsMap[item.lot]) {
          lotsMap[item.lot] = {
            lot: item.lot,
            items: [],
            date: item.purchaseDate || null,
            supplier: item.supplier || null,
            totalValue: 0
          }
        }
        lotsMap[item.lot].items.push(item)
        lotsMap[item.lot].totalValue += item.totalValue || 0
      }
    })
    
    const uniqueLots = Object.keys(lotsMap)
    console.log(`\n📊 Total de lotes únicos: ${uniqueLots.length}`)
    
    if (uniqueLots.length > 0) {
      console.log(`\n📋 Últimos 10 lotes registrados:\n`)
      const sortedLots = uniqueLots.map(lotNum => lotsMap[lotNum])
        .sort((a, b) => {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
        .slice(0, 10)
      
      sortedLots.forEach(lotData => {
        console.log(`   ${lotData.lot}`)
        console.log(`      Fecha: ${lotData.date ? formatDate(lotData.date) : 'Sin fecha'}`)
        console.log(`      Proveedor: ${lotData.supplier || 'Sin proveedor'}`)
        console.log(`      Items: ${lotData.items.length}`)
        console.log(`      Valor total: ${formatCurrency(lotData.totalValue)}`)
        console.log('')
      })
    }
    
    // Análisis por categoría
    console.log('═'.repeat(80))
    console.log('📂 ANÁLISIS POR CATEGORÍA')
    console.log('═'.repeat(80))
    
    const byCategory = {}
    inventoryItems.forEach(item => {
      const cat = item.category || 'Sin categoría'
      if (!byCategory[cat]) {
        byCategory[cat] = {
          items: 0,
          value: 0,
          withLot: 0,
          withoutLot: 0
        }
      }
      byCategory[cat].items++
      byCategory[cat].value += item.totalValue || 0
      if (item.lot && item.lot !== 'Sin lote' && item.lot.trim() !== '') {
        byCategory[cat].withLot++
      } else {
        byCategory[cat].withoutLot++
      }
    })
    
    console.log('\n')
    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1].items - a[1].items)
    
    console.log('Categoría'.padEnd(30) + 'Items'.padEnd(10) + 'Con Lote'.padEnd(12) + 'Sin Lote'.padEnd(12) + 'Valor Total'.padEnd(20))
    console.log('-'.repeat(80))
    
    sortedCategories.forEach(([cat, data]) => {
      const catName = (cat.length > 28 ? cat.substring(0, 25) + '...' : cat).padEnd(30)
      const items = data.items.toString().padEnd(10)
      const withLot = data.withLot.toString().padEnd(12)
      const withoutLot = data.withoutLot.toString().padEnd(12)
      const value = formatCurrency(data.value).padEnd(20)
      
      console.log(catName + items + withLot + withoutLot + value)
    })
    
    // Verificar gastos
    console.log('\n' + '═'.repeat(80))
    console.log('💰 AUDITORÍA DE GASTOS')
    console.log('═'.repeat(80))
    
    let totalExpenses = 0
    const expensesByCategory = {}
    const expensesByType = { fixed: 0, variable: 0 }
    
    expenses.forEach(expense => {
      totalExpenses += expense.amount || 0
      
      const cat = expense.category || 'other'
      if (!expensesByCategory[cat]) {
        expensesByCategory[cat] = 0
      }
      expensesByCategory[cat] += expense.amount || 0
      
      const type = expense.type || 'variable'
      expensesByType[type] += expense.amount || 0
    })
    
    console.log(`\n📊 Estadísticas de Gastos:`)
    console.log(`   Total de gastos: ${expenses.length}`)
    console.log(`   💰 Valor total: ${formatCurrency(totalExpenses)}`)
    console.log(`   Fijos: ${formatCurrency(expensesByType.fixed)}`)
    console.log(`   Variables: ${formatCurrency(expensesByType.variable)}`)
    
    if (Object.keys(expensesByCategory).length > 0) {
      console.log(`\n📂 Gastos por categoría:`)
      Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          console.log(`   ${cat}: ${formatCurrency(amount)}`)
        })
    }
    
    // Resumen final
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN DE CONSISTENCIA')
    console.log('═'.repeat(80))
    
    const totalIssues = itemsWithoutLot + itemsWithoutDate + itemsWithoutSupplier + itemsWithoutCategory + itemsWithoutPrice
    const consistencyScore = inventoryItems.length > 0 
      ? ((inventoryItems.length - totalIssues) / inventoryItems.length * 100).toFixed(1)
      : 100
    
    console.log(`\n✅ Nivel de consistencia: ${consistencyScore}%`)
    console.log(`\n📋 Problemas encontrados:`)
    console.log(`   - Items sin número de lote: ${itemsWithoutLot}`)
    console.log(`   - Items sin fecha de compra: ${itemsWithoutDate}`)
    console.log(`   - Items sin proveedor: ${itemsWithoutSupplier}`)
    console.log(`   - Items sin categoría: ${itemsWithoutCategory}`)
    console.log(`   - Items sin precio: ${itemsWithoutPrice}`)
    
    if (totalIssues === 0) {
      console.log(`\n🎉 ¡Excelente! La base de datos está completamente consistente`)
    } else if (itemsWithoutLot <= 50 && itemsWithoutDate === 0 && itemsWithoutSupplier === 0) {
      console.log(`\n✅ La base de datos está bien organizada. Principalmente falta asignar números de lote a algunos items.`)
    } else {
      console.log(`\n⚠️  Se recomienda corregir los problemas encontrados para mejorar la consistencia de la base de datos.`)
    }
    
    // Recomendaciones
    if (itemsWithoutLot > 0) {
      console.log(`\n💡 Recomendaciones:`)
      console.log(`   1. Asignar números de lote a los ${itemsWithoutLot} items sin lote`)
      console.log(`   2. Verificar que todos los items tengan fecha de compra`)
      console.log(`   3. Verificar que todos los items tengan proveedor registrado`)
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Auditoría completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error en auditoría:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
auditDatabase()
