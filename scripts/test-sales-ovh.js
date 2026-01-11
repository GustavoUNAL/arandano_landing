/**
 * Script para probar el registro de ventas en OVH
 * Verifica que las ventas se puedan crear correctamente
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
  
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message)
  process.exit(1)
}

// Función para probar creación de venta
async function testCreateSale() {
  console.log('\n🧪 PROBANDO CREACIÓN DE VENTA\n')
  console.log('═'.repeat(80))
  
  try {
    // Obtener un producto de prueba
    const productsSnapshot = await db.collection('products').limit(1).get()
    
    if (productsSnapshot.empty) {
      console.error('❌ No hay productos en la base de datos')
      console.log('   Primero necesitas tener productos registrados')
      process.exit(1)
    }
    
    const productDoc = productsSnapshot.docs[0]
    const product = { id: productDoc.id, ...productDoc.data() }
    
    console.log(`📦 Producto de prueba: ${product.name} (ID: ${product.id})`)
    
    // Crear venta de prueba
    const testSale = {
      date: new Date().toISOString(),
      hour: new Date().getHours(),
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price || 1000,
          totalPrice: product.price || 1000
        }
      ],
      total: product.price || 1000,
      subtotal: product.price || 1000,
      discount: 0,
      channel: 'test',
      paymentMethod: 'efectivo',
      ticketNumber: `TEST-${Date.now()}`
    }
    
    console.log('\n📝 Creando venta de prueba...')
    console.log('   Items:', testSale.items.length)
    console.log('   Total:', testSale.total)
    console.log('   Canal:', testSale.channel)
    
    // Guardar en Firestore
    const saleRef = db.collection('sales').doc(`test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
    await saleRef.set(testSale)
    
    console.log('   ✅ Venta creada exitosamente')
    console.log(`   ID: ${saleRef.id}`)
    
    // Verificar que se guardó correctamente
    const savedSale = await saleRef.get()
    if (savedSale.exists) {
      console.log('\n✅ Venta verificada en Firestore')
      console.log('   Fecha:', savedSale.data().date)
      console.log('   Total:', savedSale.data().total)
    } else {
      console.error('❌ La venta no se encontró después de crearla')
      process.exit(1)
    }
    
    // Opcional: Eliminar venta de prueba
    console.log('\n🧹 Limpiando venta de prueba...')
    await saleRef.delete()
    console.log('   ✅ Venta de prueba eliminada')
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ PRUEBA EXITOSA')
    console.log('   Las ventas se pueden registrar correctamente en Firebase\n')
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message)
    console.error('   Stack:', error.stack)
    process.exit(1)
  } finally {
    if (admin.apps.length) {
      await admin.app().delete()
    }
  }
}

// Ejecutar prueba
testCreateSale()
