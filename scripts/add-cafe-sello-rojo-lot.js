#!/usr/bin/env node

/**
 * Script para agregar lote de Café Sello Rojo comprado el lunes 19 de enero de 2026
 * 
 * Uso: node scripts/add-cafe-sello-rojo-lot.js
 */

require('dotenv').config({ path: '.env.local' })

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Configurar ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Error: Base de datos no encontrada en:', dbPath)
  console.error('   Asegúrate de que la base de datos SQLite existe')
  process.exit(1)
}

// Conectar a la base de datos
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Configurar datos del lote
const purchaseDate = '2026-01-19'
const lotNumber = `PROVEEDOR-${purchaseDate.replace(/-/g, '')}-001`
const quantity = 425 // gramos
const unitPrice = 26800 // precio total
const totalValue = unitPrice // precio total por unidad

// Item de inventario
const inventoryItem = {
  name: 'Café Sello Rojo',
  category: 'insumos para café',
  quantity: quantity,
  unit: 'Gramo',
  unitPrice: unitPrice,
  totalValue: totalValue,
  purchaseDate: purchaseDate,
  lot: lotNumber,
  supplier: 'Proveedor no especificado',
  notes: `Comprado el lunes 19 de enero de 2026. 425gr por $${unitPrice.toLocaleString('es-CO')}`
}

try {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  AGREGANDO LOTE AL INVENTARIO')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  console.log('📦 Información del lote:')
  console.log(`   Producto: ${inventoryItem.name}`)
  console.log(`   Categoría: ${inventoryItem.category}`)
  console.log(`   Cantidad: ${inventoryItem.quantity} ${inventoryItem.unit}`)
  console.log(`   Precio unitario: $${inventoryItem.unitPrice.toLocaleString('es-CO')}`)
  console.log(`   Valor total: $${inventoryItem.totalValue.toLocaleString('es-CO')}`)
  console.log(`   Fecha de compra: ${inventoryItem.purchaseDate}`)
  console.log(`   Número de lote: ${inventoryItem.lot}`)
  console.log(`   Proveedor: ${inventoryItem.supplier}`)
  console.log('')
  
  // Generar ID único
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  // Insertar en la base de datos
  const stmt = db.prepare(`
    INSERT INTO inventory (
      id, name, category, quantity, unit, unitPrice, totalValue,
      code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    id,
    inventoryItem.name,
    inventoryItem.category,
    inventoryItem.quantity,
    inventoryItem.unit,
    inventoryItem.unitPrice,
    inventoryItem.totalValue,
    null, // code
    inventoryItem.purchaseDate,
    inventoryItem.lot,
    inventoryItem.supplier,
    inventoryItem.notes,
    now,
    now
  )
  
  console.log('✅ Lote agregado exitosamente al inventario!')
  console.log(`   ID: ${id}`)
  console.log(`   Fecha de creación: ${now}`)
  console.log('')
  
  // Verificar que se guardó correctamente
  const saved = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id)
  if (saved) {
    console.log('✅ Verificación: Item guardado correctamente en la base de datos')
  } else {
    console.log('⚠️  Advertencia: No se pudo verificar el guardado')
  }
  
} catch (error) {
  console.error('❌ Error agregando lote:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}

console.log('\n═══════════════════════════════════════════════════════════')
console.log('  ✅ PROCESO COMPLETADO')
console.log('═══════════════════════════════════════════════════════════\n')
