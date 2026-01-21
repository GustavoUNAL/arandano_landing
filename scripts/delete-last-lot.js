/**
 * Script para encontrar y eliminar el último lote agregado al inventario
 */

require('dotenv').config({ path: '.env.local' })

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Configurar ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Error: Base de datos no encontrada en:', dbPath)
  process.exit(1)
}

// Conectar a la base de datos
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Funciones auxiliares
function getInventory() {
  const rows = db.prepare('SELECT * FROM inventory ORDER BY name').all()
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    unitPrice: row.unitPrice,
    totalValue: row.totalValue,
    code: row.code || undefined,
    purchaseDate: row.purchaseDate || undefined,
    lot: row.lot || undefined,
    supplier: row.supplier || undefined,
    notes: row.notes || undefined
  }))
}

function deleteInventoryItem(id) {
  const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(id)
  return result.changes > 0
}

async function deleteLastLot() {
  try {
    console.log('\n🔍 BUSCANDO ÚLTIMO LOTE AGREGADO\n')
    console.log('═'.repeat(80))
    
    const inventory = await getInventory()
    console.log(`\n📦 Total de items en inventario: ${inventory.length}\n`)
    
    // Filtrar items con lotes
    const itemsWithLots = inventory.filter(item => item.lot && item.lot.trim() !== '')
    
    if (itemsWithLots.length === 0) {
      console.log('❌ No se encontraron items con lotes\n')
      return
    }
    
    // Agrupar por lote
    const lotsMap = new Map()
    itemsWithLots.forEach(item => {
      const lot = item.lot.trim()
      if (!lotsMap.has(lot)) {
        lotsMap.set(lot, {
          lot: lot,
          items: [],
          earliestCreated: null,
          latestCreated: null
        })
      }
      lotsMap.get(lot).items.push(item)
    })
    
    // Convertir a array y ordenar por fecha de creación (más reciente primero)
    const lots = Array.from(lotsMap.values()).map(lotGroup => {
      // Intentar obtener fecha de creación del ID o usar la más reciente disponible
      const itemIds = lotGroup.items.map(i => i.id)
      const timestamps = itemIds
        .map(id => {
          const match = id.match(/inv-(\d+)-/)
          return match ? parseInt(match[1]) : 0
        })
        .filter(t => t > 0)
      
      lotGroup.earliestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0
      lotGroup.latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0
      
      return lotGroup
    })
    
    // Ordenar por timestamp más reciente
    lots.sort((a, b) => b.latestTimestamp - a.latestTimestamp)
    
    console.log('📋 Lotes encontrados (ordenados por más reciente primero):\n')
    lots.slice(0, 10).forEach((lot, index) => {
      const date = new Date(lot.latestTimestamp)
      console.log(`${index + 1}. Lote: "${lot.lot}"`)
      console.log(`   Items: ${lot.items.length}`)
      console.log(`   Fecha aproximada: ${lot.latestTimestamp > 0 ? date.toLocaleString('es-CO') : 'N/A'}`)
      console.log(`   Total valor: $${lot.items.reduce((sum, i) => sum + (i.totalValue || 0), 0).toLocaleString('es-CO')}`)
      console.log('')
    })
    
    // El último lote agregado es el primero en la lista
    const lastLot = lots[0]
    
    if (!lastLot) {
      console.log('❌ No se pudo determinar el último lote\n')
      return
    }
    
    console.log('═'.repeat(80))
    console.log(`\n🗑️  ELIMINANDO ÚLTIMO LOTE: "${lastLot.lot}"\n`)
    console.log(`   Items a eliminar: ${lastLot.items.length}`)
    console.log(`   Valor total: $${lastLot.items.reduce((sum, i) => sum + (i.totalValue || 0), 0).toLocaleString('es-CO')}\n`)
    
    // Eliminar cada item
    let deletedCount = 0
    let errors = []
    
    for (const item of lastLot.items) {
      try {
        const deleted = await deleteInventoryItem(item.id)
        if (deleted) {
          deletedCount++
          console.log(`   ✅ Eliminado: ${item.name} (${item.id})`)
        } else {
          errors.push(`No se pudo eliminar ${item.id}`)
          console.log(`   ⚠️  No se pudo eliminar: ${item.name} (${item.id})`)
        }
      } catch (error) {
        errors.push(`Error eliminando ${item.id}: ${error.message}`)
        console.log(`   ❌ Error eliminando ${item.name}: ${error.message}`)
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('\n📊 RESULTADO\n')
    console.log(`   ✅ Items eliminados: ${deletedCount}`)
    if (errors.length > 0) {
      console.log(`   ❌ Errores: ${errors.length}`)
      errors.forEach(err => console.log(`      - ${err}`))
    }
    console.log('\n✅ Proceso completado\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  deleteLastLot().then(() => {
    process.exit(0)
  }).catch(error => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { deleteLastLot }
