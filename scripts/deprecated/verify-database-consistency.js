#!/usr/bin/env node

/**
 * Script para verificar la consistencia de la base de datos Firebase
 * Verifica que todos los items tengan número de lote, fecha, proveedor, etc.
 * 
 * Uso: node scripts/verify-database-consistency.js
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

// Función para generar número de lote automático
function generateLotNumber(supplier, purchaseDate) {
  if (!supplier || !purchaseDate) return null
  
  // Normalizar nombre del proveedor
  const supplierNormalized = supplier
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8)
  
  const dateNormalized = purchaseDate.replace(/-/g, '')
  
  return `${supplierNormalized}-${dateNormalized}-001`
}

// Función principal
async function verifyDatabaseConsistency() {
  console.log('\n🔍 VERIFICANDO CONSISTENCIA DE LA BASE DE DATOS\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    // Obtener todos los items de inventario
    console.log('\n📥 Obteniendo datos de inventario...\n')
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
    
    // Obtener todos los gastos
    console.log('📥 Obteniendo datos de gastos...\n')
    const expensesSnapshot = await db.collection('expenses').get()
    
    const expenses = []
    expensesSnapshot.forEach(doc => {
      const data = doc.data()
      expenses.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log(`✅ Se encontraron ${expenses.length} gastos\n`)
    
    // Obtener todos los productos
    console.log('📥 Obteniendo datos de productos...\n')
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
    
    // Analizar consistencia del inventario
    console.log('═'.repeat(80))
    console.log('📊 ANÁLISIS DE CONSISTENCIA - INVENTARIO')
    console.log('═'.repeat(80))
    
    const issues = {
      missingLot: [],
      missingPurchaseDate: [],
      missingSupplier: [],
      missingCategory: [],
      missingPrice: [],
      missingQuantity: [],
      incomplete: []
    }
    
    const completeItems = []
    
    inventoryItems.forEach(item => {
      const itemIssues = []
      
      if (!item.lot || item.lot === 'Sin lote') {
        issues.missingLot.push(item)
        itemIssues.push('Sin número de lote')
      }
      
      if (!item.purchaseDate) {
        issues.missingPurchaseDate.push(item)
        itemIssues.push('Sin fecha de compra')
      }
      
      if (!item.supplier || item.supplier === 'Sin proveedor') {
        issues.missingSupplier.push(item)
        itemIssues.push('Sin proveedor')
      }
      
      if (!item.category) {
        issues.missingCategory.push(item)
        itemIssues.push('Sin categoría')
      }
      
      if (!item.unitPrice && item.unitPrice !== 0) {
        issues.missingPrice.push(item)
        itemIssues.push('Sin precio unitario')
      }
      
      if (!item.quantity && item.quantity !== 0) {
        issues.missingQuantity.push(item)
        itemIssues.push('Sin cantidad')
      }
      
      if (itemIssues.length === 0) {
        completeItems.push(item)
      } else {
        issues.incomplete.push({
          item,
          issues: itemIssues
        })
      }
    })
    
    // Mostrar resumen
    console.log(`\n✅ Items completos: ${completeItems.length}/${inventoryItems.length}`)
    console.log(`⚠️  Items con problemas: ${issues.incomplete.length}/${inventoryItems.length}\n`)
    
    console.log('📋 Desglose de problemas:')
    console.log(`   - Sin número de lote: ${issues.missingLot.length}`)
    console.log(`   - Sin fecha de compra: ${issues.missingPurchaseDate.length}`)
    console.log(`   - Sin proveedor: ${issues.missingSupplier.length}`)
    console.log(`   - Sin categoría: ${issues.missingCategory.length}`)
    console.log(`   - Sin precio unitario: ${issues.missingPrice.length}`)
    console.log(`   - Sin cantidad: ${issues.missingQuantity.length}`)
    
    // Mostrar items sin lote (los más importantes)
    if (issues.missingLot.length > 0) {
      console.log('\n' + '═'.repeat(80))
      console.log('⚠️  ITEMS SIN NÚMERO DE LOTE')
      console.log('═'.repeat(80))
      
      // Agrupar por fecha y proveedor para sugerir lotes
      const groupedByDateAndSupplier = {}
      
      issues.missingLot.forEach(item => {
        const key = `${item.purchaseDate || 'sin-fecha'}_${item.supplier || 'sin-proveedor'}`
        if (!groupedByDateAndSupplier[key]) {
          groupedByDateAndSupplier[key] = {
            date: item.purchaseDate,
            supplier: item.supplier,
            items: []
          }
        }
        groupedByDateAndSupplier[key].items.push(item)
      })
      
      console.log(`\n📦 Se pueden agrupar en ${Object.keys(groupedByDateAndSupplier).length} lote(s) potencial(es):\n`)
      
      Object.keys(groupedByDateAndSupplier).forEach((key, index) => {
        const group = groupedByDateAndSupplier[key]
        const suggestedLot = generateLotNumber(group.supplier, group.date)
        
        console.log(`Lote ${index + 1}: ${suggestedLot || 'N/A'}`)
        console.log(`   Fecha: ${group.date ? formatDate(group.date) : 'Sin fecha'}`)
        console.log(`   Proveedor: ${group.supplier || 'Sin proveedor'}`)
        console.log(`   Items: ${group.items.length}`)
        console.log(`   Items:`)
        group.items.slice(0, 5).forEach(item => {
          console.log(`     - ${item.name || 'Sin nombre'}`)
        })
        if (group.items.length > 5) {
          console.log(`     ... y ${group.items.length - 5} más`)
        }
        console.log('')
      })
    }
    
    // Analizar gastos
    console.log('\n' + '═'.repeat(80))
    console.log('📊 ANÁLISIS DE CONSISTENCIA - GASTOS')
    console.log('═'.repeat(80))
    
    const expenseIssues = {
      missingDate: [],
      missingType: [],
      missingCategory: [],
      missingDescription: [],
      missingAmount: [],
      incomplete: []
    }
    
    const completeExpenses = []
    
    expenses.forEach(expense => {
      const expenseIssuesList = []
      
      if (!expense.date) {
        expenseIssues.missingDate.push(expense)
        expenseIssuesList.push('Sin fecha')
      }
      
      if (!expense.type) {
        expenseIssues.missingType.push(expense)
        expenseIssuesList.push('Sin tipo')
      }
      
      if (!expense.category) {
        expenseIssues.missingCategory.push(expense)
        expenseIssuesList.push('Sin categoría')
      }
      
      if (!expense.description) {
        expenseIssues.missingDescription.push(expense)
        expenseIssuesList.push('Sin descripción')
      }
      
      if (!expense.amount && expense.amount !== 0) {
        expenseIssues.missingAmount.push(expense)
        expenseIssuesList.push('Sin monto')
      }
      
      if (expenseIssuesList.length === 0) {
        completeExpenses.push(expense)
      } else {
        expenseIssues.incomplete.push({
          expense,
          issues: expenseIssuesList
        })
      }
    })
    
    console.log(`\n✅ Gastos completos: ${completeExpenses.length}/${expenses.length}`)
    console.log(`⚠️  Gastos con problemas: ${expenseIssues.incomplete.length}/${expenses.length}\n`)
    
    if (expenseIssues.incomplete.length > 0) {
      console.log('📋 Problemas encontrados:')
      console.log(`   - Sin fecha: ${expenseIssues.missingDate.length}`)
      console.log(`   - Sin tipo: ${expenseIssues.missingType.length}`)
      console.log(`   - Sin categoría: ${expenseIssues.missingCategory.length}`)
      console.log(`   - Sin descripción: ${expenseIssues.missingDescription.length}`)
      console.log(`   - Sin monto: ${expenseIssues.missingAmount.length}`)
    }
    
    // Resumen general
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN GENERAL DE CONSISTENCIA')
    console.log('═'.repeat(80))
    
    const totalInventoryIssues = issues.incomplete.length
    const totalExpenseIssues = expenseIssues.incomplete.length
    const totalIssues = totalInventoryIssues + totalExpenseIssues
    
    console.log(`\n📦 Inventario:`)
    console.log(`   Total items: ${inventoryItems.length}`)
    console.log(`   Items completos: ${completeItems.length} (${((completeItems.length / inventoryItems.length) * 100).toFixed(1)}%)`)
    console.log(`   Items con problemas: ${totalInventoryIssues} (${((totalInventoryIssues / inventoryItems.length) * 100).toFixed(1)}%)`)
    
    console.log(`\n💰 Gastos:`)
    console.log(`   Total gastos: ${expenses.length}`)
    console.log(`   Gastos completos: ${completeExpenses.length} (${expenses.length > 0 ? ((completeExpenses.length / expenses.length) * 100).toFixed(1) : 0}%)`)
    console.log(`   Gastos con problemas: ${totalExpenseIssues} (${expenses.length > 0 ? ((totalExpenseIssues / expenses.length) * 100).toFixed(1) : 0}%)`)
    
    console.log(`\n🛍️  Productos:`)
    console.log(`   Total productos: ${products.length}`)
    
    // Estadísticas de lotes
    const lotsMap = {}
    inventoryItems.forEach(item => {
      if (item.lot && item.lot !== 'Sin lote') {
        if (!lotsMap[item.lot]) {
          lotsMap[item.lot] = {
            count: 0,
            date: item.purchaseDate,
            supplier: item.supplier,
            totalValue: 0
          }
        }
        lotsMap[item.lot].count++
        lotsMap[item.lot].totalValue += item.totalValue || 0
      }
    })
    
    const uniqueLots = Object.keys(lotsMap)
    
    console.log(`\n🏷️  Números de lote:`)
    console.log(`   Lotes únicos: ${uniqueLots.length}`)
    console.log(`   Items con lote: ${inventoryItems.filter(i => i.lot && i.lot !== 'Sin lote').length}`)
    console.log(`   Items sin lote: ${issues.missingLot.length}`)
    
    // Recomendaciones
    console.log('\n' + '═'.repeat(80))
    console.log('💡 RECOMENDACIONES')
    console.log('═'.repeat(80))
    
    if (issues.missingLot.length > 0) {
      console.log(`\n⚠️  Se recomienda asignar números de lote a ${issues.missingLot.length} items`)
      console.log(`   Los items se pueden agrupar por fecha y proveedor para crear lotes`)
    }
    
    if (issues.missingPurchaseDate.length > 0) {
      console.log(`\n⚠️  Se recomienda agregar fecha de compra a ${issues.missingPurchaseDate.length} items`)
    }
    
    if (issues.missingSupplier.length > 0) {
      console.log(`\n⚠️  Se recomienda agregar proveedor a ${issues.missingSupplier.length} items`)
    }
    
    if (totalIssues === 0) {
      console.log(`\n✅ ¡Excelente! Todos los datos están completos y organizados`)
    } else {
      console.log(`\n📝 Total de problemas encontrados: ${totalIssues}`)
      console.log(`   Se recomienda corregir estos problemas para mantener la consistencia de los datos`)
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Verificación completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error verificando consistencia:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
verifyDatabaseConsistency()
