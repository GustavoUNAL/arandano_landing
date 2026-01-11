/**
 * Script para migrar ventas de JSON local a Firebase
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
  console.log('✅ Firebase Admin inicializado\n')
  
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message)
  process.exit(1)
}

// Función para migrar ventas
async function migrateSales() {
  console.log('📦 MIGRANDO VENTAS DE JSON A FIREBASE\n')
  console.log('═'.repeat(80))
  
  try {
    // Leer ventas del JSON local
    const salesFilePath = path.join(__dirname, '../data/sales.json')
    
    if (!fs.existsSync(salesFilePath)) {
      console.log('⚠️  No se encontró data/sales.json')
      console.log('   No hay ventas para migrar\n')
      return
    }
    
    const salesData = fs.readFileSync(salesFilePath, 'utf8')
    const sales = JSON.parse(salesData)
    
    if (!Array.isArray(sales) || sales.length === 0) {
      console.log('⚠️  No hay ventas en el archivo JSON')
      console.log('   Archivo vacío o sin ventas\n')
      return
    }
    
    console.log(`📊 Ventas encontradas en JSON: ${sales.length}\n`)
    
    // Verificar ventas existentes en Firebase
    const existingSnapshot = await db.collection('sales').get()
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id))
    
    console.log(`📊 Ventas existentes en Firebase: ${existingIds.size}\n`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    // Migrar ventas
    console.log('🔄 Migrando ventas...\n')
    
    for (const sale of sales) {
      try {
        // Si ya existe en Firebase, saltarla
        if (existingIds.has(sale.id)) {
          skippedCount++
          continue
        }
        
        // Guardar en Firebase
        await db.collection('sales').doc(sale.id).set(sale)
        migratedCount++
        
        console.log(`   ✅ Migrada: ${sale.ticketNumber || sale.id} - $${(sale.total || 0).toLocaleString('es-CO')}`)
        
      } catch (error) {
        errorCount++
        console.error(`   ❌ Error migrando venta ${sale.id}:`, error.message)
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('\n📊 RESUMEN:\n')
    console.log(`   Total en JSON: ${sales.length}`)
    console.log(`   ✅ Migradas: ${migratedCount}`)
    console.log(`   ⏭️  Saltadas (ya existían): ${skippedCount}`)
    console.log(`   ❌ Errores: ${errorCount}`)
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Migración completada\n')
    
  } catch (error) {
    console.error('\n❌ Error en la migración:', error.message)
    console.error('   Stack:', error.stack)
    process.exit(1)
  } finally {
    if (admin.apps.length) {
      await admin.app().delete()
    }
  }
}

// Ejecutar migración
migrateSales()
