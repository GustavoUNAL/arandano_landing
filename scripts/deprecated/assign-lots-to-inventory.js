/**
 * Script para asignar lotes a items de inventario según su proveedor y fecha
 * Asegura que cada item tenga un lote basado en su proveedor y fecha de compra
 */

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Cargar credenciales de Firebase si están disponibles
let db = null
let useFirebase = false

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    }
    
    db = admin.firestore()
    useFirebase = true
    console.log('✅ Firebase conectado')
  }
} catch (error) {
  console.log('⚠️  Firebase no disponible, usando JSON')
}

// Función para obtener inventario
async function getInventory() {
  if (useFirebase && db) {
    try {
      const snapshot = await db.collection('inventory').get()
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.log('⚠️  Error obteniendo de Firebase, usando JSON local')
      useFirebase = false
    }
  }
  
  // Fallback a JSON local
  const inventoryPath = path.join(__dirname, '../data/inventory.json')
  if (fs.existsSync(inventoryPath)) {
    const data = fs.readFileSync(inventoryPath, 'utf8')
    return JSON.parse(data)
  }
  return []
}

// Función para guardar inventario
async function saveInventory(items) {
  // Siempre guardar en JSON local
  const inventoryPath = path.join(__dirname, '../data/inventory.json')
  fs.writeFileSync(inventoryPath, JSON.stringify(items, null, 2), 'utf8')
  console.log('✅ Guardado en JSON local')
  
  // También guardar en Firebase si está disponible
  if (useFirebase && db) {
    try {
      const batch = db.batch()
      items.forEach(item => {
        const itemRef = db.collection('inventory').doc(item.id)
        batch.set(itemRef, item, { merge: true })
      })
      await batch.commit()
      console.log('✅ Guardado en Firebase')
    } catch (error) {
      console.log('⚠️  Error guardando en Firebase:', error.message)
    }
  }
}

// Función para generar número de lote
function generateLotNumber(supplier, purchaseDate) {
  if (!supplier || !purchaseDate) return null
  
  // Normalizar nombre del proveedor para el lote
  const supplierMap = {
    'Patty': 'PATY',
    'Paty': 'PATY',
    'Éxito': 'EXITO',
    'Exito': 'EXITO',
    'Alkosto': 'ALKOSTO',
    'Jumbo': 'JUMBO',
    'Carnes del Sebastián': 'CARNESSEBASTIAN',
    'Carnes Sebastián': 'CARNESSEBASTIAN',
    'La tienda de la esquina': 'TIENDAESQUINA',
    'Tienda esquina': 'TIENDAESQUIN',
    'A2SAS': 'A2SAS',
    'A2 SAS': 'A2SAS',
    'Grupo Empresarial A2 SAS': 'GRUPOEMPRESA',
    'La Merced': 'LAMERCED'
  }
  
  const normalizedSupplier = supplierMap[supplier] || supplier.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12)
  const dateNormalized = purchaseDate.replace(/-/g, '')
  
  return `${normalizedSupplier}-${dateNormalized}-001`
}

// Función principal
async function assignLots() {
  console.log('\n📦 ASIGNANDO LOTES A ITEMS DE INVENTARIO\n')
  console.log('═'.repeat(80))
  
  try {
    const inventory = await getInventory()
    
    console.log(`\n📊 Total de items en inventario: ${inventory.length}\n`)
    
    // Agrupar items por proveedor y fecha para crear lotes
    const itemsBySupplierDate = new Map()
    
    inventory.forEach(item => {
      const supplier = item.supplier
      const purchaseDate = item.purchaseDate
      
      if (supplier && purchaseDate) {
        const key = `${supplier}_${purchaseDate}`
        if (!itemsBySupplierDate.has(key)) {
          itemsBySupplierDate.set(key, {
            supplier,
            purchaseDate,
            items: []
          })
        }
        itemsBySupplierDate.get(key).items.push(item)
      }
    })
    
    console.log(`📊 Encontrados ${itemsBySupplierDate.size} grupos de proveedor/fecha\n`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    // Procesar cada grupo
    for (const [key, group] of itemsBySupplierDate.entries()) {
      const lotNumber = generateLotNumber(group.supplier, group.purchaseDate)
      
      console.log(`\n🔹 ${group.supplier} - ${group.purchaseDate}`)
      console.log(`   Lote: ${lotNumber}`)
      console.log(`   Items: ${group.items.length}`)
      
      // Actualizar items que no tienen lote o tienen lote diferente
      let groupUpdated = 0
      for (const item of group.items) {
        if (!item.lot || item.lot !== lotNumber) {
          item.lot = lotNumber
          updatedCount++
          groupUpdated++
        } else {
          skippedCount++
        }
      }
      if (groupUpdated > 0) {
        console.log(`   ✅ ${groupUpdated} items actualizados`)
      } else {
        console.log(`   ✓ Todos los items ya tienen el lote correcto`)
      }
    }
    
    // Guardar cambios
    if (updatedCount > 0) {
      await saveInventory(inventory)
      console.log('\n' + '═'.repeat(80))
      console.log('\n✅ CAMBIOS GUARDADOS')
      console.log(`   Items actualizados: ${updatedCount}`)
      console.log(`   Items sin cambios: ${skippedCount}`)
    } else {
      console.log('\n' + '═'.repeat(80))
      console.log('\n✅ No se necesitaron cambios')
      console.log(`   Todos los items ya tienen lotes asignados correctamente`)
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Proceso completado\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    if (useFirebase && admin.apps.length) {
      await admin.app().delete()
    }
  }
}

// Ejecutar
assignLots()
