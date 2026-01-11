/**
 * Script para verificar que las ventas se están guardando en Firebase
 * y mostrar estadísticas de ventas
 */

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Cargar credenciales de Firebase
let db = null

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ No se encontró firebase-service-account.json')
    process.exit(1)
  }
  
  const serviceAccount = require(serviceAccountPath)
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }
  
  db = admin.firestore()
  console.log('✅ Firebase Admin inicializado')
  console.log(`   Proyecto: ${serviceAccount.project_id || 'unknown'}\n`)
  
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message)
  process.exit(1)
}

// Función para verificar ventas en Firebase
async function verifySales() {
  console.log('🔍 VERIFICANDO VENTAS EN FIREBASE\n')
  console.log('═'.repeat(80))
  
  try {
    // Obtener todas las ventas
    const snapshot = await db.collection('sales').orderBy('date', 'desc').get()
    
    if (snapshot.empty) {
      console.log('\n⚠️  No hay ventas en Firebase')
      console.log('   Esto puede ser normal si es la primera vez que usas Firebase')
      console.log('   Las nuevas ventas se guardarán aquí automáticamente\n')
      return
    }
    
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`\n✅ Ventas encontradas en Firebase: ${sales.length}\n`)
    
    // Mostrar últimas 10 ventas
    console.log('📊 ÚLTIMAS 10 VENTAS:\n')
    sales.slice(0, 10).forEach((sale, index) => {
      const date = sale.date ? new Date(sale.date).toLocaleString('es-CO') : 'Sin fecha'
      console.log(`${index + 1}. ${sale.ticketNumber || sale.id}`)
      console.log(`   Fecha: ${date}`)
      console.log(`   Items: ${sale.items?.length || 0}`)
      console.log(`   Total: $${(sale.total || 0).toLocaleString('es-CO')}`)
      console.log(`   Canal: ${sale.channel || 'N/A'}`)
      console.log(`   Método: ${sale.paymentMethod || 'N/A'}`)
      console.log('')
    })
    
    // Estadísticas
    const totalSales = sales.length
    const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = sales.filter(sale => {
      const saleDate = sale.date ? new Date(sale.date) : null
      return saleDate && saleDate >= today
    })
    
    console.log('═'.repeat(80))
    console.log('\n📈 ESTADÍSTICAS:\n')
    console.log(`   Total de ventas: ${totalSales}`)
    console.log(`   Ventas hoy: ${todaySales.length}`)
    console.log(`   Monto total: $${totalAmount.toLocaleString('es-CO')}`)
    console.log(`   Monto hoy: $${todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0).toLocaleString('es-CO')}`)
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Verificación completada\n')
    
  } catch (error) {
    console.error('\n❌ Error verificando ventas:', error.message)
    console.error('   Stack:', error.stack)
    process.exit(1)
  } finally {
    if (admin.apps.length) {
      await admin.app().delete()
    }
  }
}

// Ejecutar verificación
verifySales()
