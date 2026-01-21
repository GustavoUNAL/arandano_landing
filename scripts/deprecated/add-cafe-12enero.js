/**
 * Script para agregar compra de café del 12 de enero de 2026 al inventario
 */

const admin = require('firebase-admin')
const path = require('path')

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json')
const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// Configuración
const PURCHASE_DATE = '2026-01-12'
const SUPPLIER = 'Proveedor Café'
const lotNumber = `PROVEEDORCAFE-${PURCHASE_DATE.replace(/-/g, '')}-001`

// Productos a agregar
const cafeItems = [
  {
    name: 'Café especial Buesaco',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Paquete', // 400gr
    unitPrice: 37000,
    totalValue: 37000,
    code: 'CAF-BUE-400GR',
    notes: 'Café especial Buesaco 400gr (sin moler)'
  },
  {
    name: 'Café La Jacoba',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Paquete', // 500gr
    unitPrice: 37000,
    totalValue: 37000,
    code: 'CAF-JAC-500GR',
    notes: 'Café La Jacoba 500gr (molido)'
  }
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

async function addCafeLot() {
  try {
    console.log('\n' + '═'.repeat(80))
    console.log('☕ AGREGANDO COMPRA DE CAFÉ DEL 12 DE ENERO DE 2026')
    console.log('═'.repeat(80))
    console.log(`\n📅 Fecha de compra: ${PURCHASE_DATE}`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)

    console.log('📦 Productos a agregar:')
    const totalValue = cafeItems.reduce((sum, item) => sum + item.totalValue, 0)
    cafeItems.forEach((item, index) => {
      console.log(`\n   ${index + 1}. ${item.name}`)
      console.log(`      Categoría: ${item.category}`)
      console.log(`      Cantidad: ${item.quantity} ${item.unit}`)
      console.log(`      Precio unitario: ${formatCurrency(item.unitPrice)}`)
      console.log(`      Total: ${formatCurrency(item.totalValue)}`)
      if (item.notes) {
        console.log(`      Notas: ${item.notes}`)
      }
    })
    
    console.log(`\n💰 Valor total: ${formatCurrency(totalValue)}\n`)
    console.log('📥 Agregando items a Firebase...\n')
    
    let successCount = 0
    let errorCount = 0
    
    for (const item of cafeItems) {
      try {
        const itemData = {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue,
          supplier: SUPPLIER,
          purchaseDate: PURCHASE_DATE,
          lot: lotNumber,
          code: item.code
        }
        
        if (item.notes) {
          itemData.notes = item.notes
        }
        
        const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await db.collection('inventory').doc(itemId).set(itemData)
        
        console.log(`   ✅ ${item.name} agregado correctamente (ID: ${itemId})`)
        successCount++
        
        // Pequeño delay para evitar problemas con timestamps
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`   ❌ Error agregando ${item.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items agregados exitosamente: ${successCount}`)
    if (errorCount > 0) {
      console.log(`❌ Items con error: ${errorCount}`)
    }
    console.log(`💰 Valor total del lote: ${formatCurrency(totalValue)}`)
    console.log(`🏷️  Número de lote: ${lotNumber}`)
    console.log(`📅 Fecha de compra: ${PURCHASE_DATE}`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Proceso completado')
    console.log('═'.repeat(80) + '\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error agregando lote:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
addCafeLot()
