#!/usr/bin/env node

/**
 * Script para generar reporte de ventas desde Firebase
 * 
 * Uso: node scripts/report-sales.js
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
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para formatear fecha ISO
function formatDateISO(dateString) {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
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

// Función principal
async function generateReport() {
  console.log('\n📊 GENERANDO REPORTE DE VENTAS\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    // Obtener todas las ventas ordenadas por fecha descendente
    console.log('\n📥 Obteniendo ventas desde Firebase...\n')
    const salesSnapshot = await db.collection('sales')
      .orderBy('date', 'desc')
      .get()
    
    if (salesSnapshot.empty) {
      console.log('⚠️  No se encontraron ventas en la base de datos')
      return
    }
    
    const sales = []
    salesSnapshot.forEach(doc => {
      const data = doc.data()
      sales.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log(`✅ Se encontraron ${sales.length} ventas\n`)
    
    // Agrupar ventas por fecha (lotes)
    const salesByDate = {}
    let totalRevenue = 0
    let totalSales = 0
    let totalItems = 0
    
    sales.forEach(sale => {
      const date = sale.date ? new Date(sale.date).toISOString().split('T')[0] : 'Sin fecha'
      
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date: date,
          sales: [],
          revenue: 0,
          count: 0,
          items: 0
        }
      }
      
      salesByDate[date].sales.push(sale)
      salesByDate[date].revenue += sale.total || 0
      salesByDate[date].count += 1
      salesByDate[date].items += (sale.items || []).length
      
      totalRevenue += sale.total || 0
      totalSales += 1
      totalItems += (sale.items || []).length
    })
    
    // Ordenar fechas descendente
    const sortedDates = Object.keys(salesByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
    
    // Obtener última fecha (último lote)
    const lastDate = sortedDates[0]
    const lastBatch = salesByDate[lastDate]
    
    // REPORTE GENERAL
    console.log('═'.repeat(80))
    console.log('📈 REPORTE GENERAL DE VENTAS')
    console.log('═'.repeat(80))
    console.log(`\n📅 Período analizado:`)
    console.log(`   Primera venta: ${sortedDates.length > 0 ? formatDate(sortedDates[sortedDates.length - 1]) : 'N/A'}`)
    console.log(`   Última venta:  ${lastDate ? formatDate(lastDate) : 'N/A'}`)
    console.log(`\n💰 Totales:`)
    console.log(`   Total de ventas: ${totalSales.toLocaleString()}`)
    console.log(`   Total de items:  ${totalItems.toLocaleString()}`)
    console.log(`   Ingresos totales: ${formatCurrency(totalRevenue)}`)
    console.log(`   Promedio por venta: ${formatCurrency(totalSales > 0 ? totalRevenue / totalSales : 0)}`)
    
    // REPORTE DEL ÚLTIMO LOTE
    console.log('\n' + '═'.repeat(80))
    console.log('📦 ÚLTIMO LOTE (Ventas del día más reciente)')
    console.log('═'.repeat(80))
    console.log(`\n📅 Fecha del último lote: ${formatDate(lastDate)} (${lastDate})`)
    console.log(`\n📊 Estadísticas del último lote:`)
    console.log(`   Número de ventas: ${lastBatch.count}`)
    console.log(`   Total de items:   ${lastBatch.items}`)
    console.log(`   Ingresos:         ${formatCurrency(lastBatch.revenue)}`)
    console.log(`   Promedio por venta: ${formatCurrency(lastBatch.count > 0 ? lastBatch.revenue / lastBatch.count : 0)}`)
    
    // Análisis por canal
    const byChannel = {}
    const byPaymentMethod = {}
    
    lastBatch.sales.forEach(sale => {
      const channel = sale.channel || 'desconocido'
      const payment = sale.paymentMethod || 'no especificado'
      
      byChannel[channel] = (byChannel[channel] || 0) + 1
      byPaymentMethod[payment] = (byPaymentMethod[payment] || 0) + 1
    })
    
    console.log(`\n📱 Ventas por canal:`)
    Object.entries(byChannel)
      .sort((a, b) => b[1] - a[1])
      .forEach(([channel, count]) => {
        const percentage = ((count / lastBatch.count) * 100).toFixed(1)
        console.log(`   ${channel}: ${count} ventas (${percentage}%)`)
      })
    
    console.log(`\n💳 Ventas por método de pago:`)
    Object.entries(byPaymentMethod)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        const percentage = ((count / lastBatch.count) * 100).toFixed(1)
        console.log(`   ${method}: ${count} ventas (${percentage}%)`)
      })
    
    // TOP 5 PRODUCTOS DEL ÚLTIMO LOTE
    const productSales = {}
    lastBatch.sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const productId = item.productId || 'sin-id'
        const productName = item.productName || 'Producto sin nombre'
        
        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            quantity: 0,
            revenue: 0
          }
        }
        
        productSales[productId].quantity += item.quantity || 0
        productSales[productId].revenue += item.totalPrice || 0
      })
    })
    
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    
    if (topProducts.length > 0) {
      console.log(`\n🏆 Top 5 productos del último lote:`)
      topProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`)
        console.log(`      Cantidad: ${product.quantity} | Ingresos: ${formatCurrency(product.revenue)}`)
      })
    }
    
    // REPORTE POR LOTE (Últimos 10 días)
    console.log('\n' + '═'.repeat(80))
    console.log('📅 RESUMEN POR LOTE (Últimos 10 días)')
    console.log('═'.repeat(80))
    
    const last10Days = sortedDates.slice(0, 10)
    
    console.log('\n')
    console.log('Fecha'.padEnd(20) + 'Ventas'.padEnd(12) + 'Items'.padEnd(12) + 'Ingresos'.padEnd(20))
    console.log('-'.repeat(64))
    
    last10Days.forEach(date => {
      const batch = salesByDate[date]
      const dateFormatted = formatDateISO(date)
      const count = batch.count.toString().padEnd(12)
      const items = batch.items.toString().padEnd(12)
      const revenue = formatCurrency(batch.revenue).padEnd(20)
      
      console.log(dateFormatted.padEnd(20) + count + items + revenue)
    })
    
    // DETALLES DEL ÚLTIMO LOTE
    console.log('\n' + '═'.repeat(80))
    console.log('📋 DETALLES DE VENTAS DEL ÚLTIMO LOTE')
    console.log('═'.repeat(80))
    
    const sortedSales = lastBatch.sales.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime()
      const dateB = new Date(b.date || 0).getTime()
      return dateB - dateA
    })
    
    console.log('\n')
    sortedSales.forEach((sale, index) => {
      const saleDate = sale.date ? new Date(sale.date) : new Date()
      const timeStr = sale.hour !== undefined 
        ? `${sale.hour.toString().padStart(2, '0')}:00`
        : saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      
      console.log(`\n${index + 1}. Venta ${sale.id.substring(0, 12)}...`)
      console.log(`   📅 Fecha: ${formatDate(sale.date)} a las ${timeStr}`)
      console.log(`   📱 Canal: ${sale.channel || 'no especificado'}`)
      console.log(`   💳 Pago: ${sale.paymentMethod || 'no especificado'}`)
      console.log(`   🛒 Items: ${(sale.items || []).length}`)
      console.log(`   💰 Total: ${formatCurrency(sale.total)}`)
      
      if (sale.items && sale.items.length > 0) {
        console.log(`   📦 Productos:`)
        sale.items.forEach(item => {
          console.log(`      - ${item.productName} (x${item.quantity}) = ${formatCurrency(item.totalPrice)}`)
        })
      }
      
      if (sale.comment) {
        console.log(`   📝 Comentario: ${sale.comment}`)
      }
    })
    
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
