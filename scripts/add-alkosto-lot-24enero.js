#!/usr/bin/env node

/**
 * Script para agregar lote de Alkosto centro
 * Fecha: 2026-01-24
 * Pagado por: Sonia
 * 
 * Uso: node scripts/add-alkosto-lot-24enero.js
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
const purchaseDate = '2026-01-24'
const lotNumber = `ALKOSTO-${purchaseDate.replace(/-/g, '')}-001`
const supplier = 'Alkosto centro'
const paidBy = 'Sonia'

// Función para convertir números con formato colombiano (puntos como separadores de miles)
function parseColombianNumber(str) {
  if (typeof str === 'number') return str
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}

// Items del lote
const items = [
  {
    name: 'Papelera roja coltp pedal 25 L',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('32900'),
    totalValue: parseColombianNumber('32900')
  },
  {
    name: 'Uva Red Globe nacional',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Kilogramo',
    unitPrice: parseColombianNumber('23375'),
    totalValue: parseColombianNumber('23375'),
    notes: '0,93 kg'
  },
  {
    name: 'Vaso Can Glass 12 oz',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('16900'),
    totalValue: parseColombianNumber('16900')
  },
  {
    name: 'Copa Lord fondo color 20 oz',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('14900'),
    totalValue: parseColombianNumber('14900')
  },
  {
    name: 'Copa Martini Avíspero 9.5 oz',
    category: 'activos',
    quantity: 6,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('6900'), // 41.400 / 6 = 6.900
    totalValue: parseColombianNumber('41400')
  },
  {
    name: 'Salsa Tajín Clásic polvo 142 g',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12900'),
    totalValue: parseColombianNumber('12900')
  },
  {
    name: 'Papel Marg Refect Lim/Pimien 115 g',
    category: 'productos de limpieza',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('8500'),
    totalValue: parseColombianNumber('8500')
  },
  {
    name: 'Cuchillo multiuso Ilko 11 cm',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12900'),
    totalValue: parseColombianNumber('12900')
  },
  {
    name: 'Mezclador Refisal Michel Rep x6',
    category: 'activos',
    quantity: 3,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('8900'), // 26.700 / 3 = 8.900
    totalValue: parseColombianNumber('26700')
  },
  {
    name: 'Copa Nevada Cappuchinero 4.5 oz',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('50200'),
    totalValue: parseColombianNumber('50200')
  },
  {
    name: 'Licor Vodka Tropcaya 750 ml',
    category: 'licores',
    quantity: 1,
    unit: 'Botella',
    unitPrice: parseColombianNumber('18200'),
    totalValue: parseColombianNumber('18200'),
    capacity: 750,
    capacityUnit: 'ml'
  },
  {
    name: 'Película plástica Tami Rto x100 mt',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('32500'),
    totalValue: parseColombianNumber('32500')
  },
  {
    name: 'Estuche 4 pz postre Corona Caribe',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12900'),
    totalValue: parseColombianNumber('12900')
  },
  {
    name: 'Set x4 coladores Arco Iris',
    category: 'activos',
    quantity: 1,
    unit: 'Set',
    unitPrice: parseColombianNumber('12900'),
    totalValue: parseColombianNumber('12900')
  }
]

try {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  AGREGANDO LOTE DE ALKOSTO AL INVENTARIO')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  console.log('📋 Información de la compra:')
  console.log(`   Proveedor: ${supplier}`)
  console.log(`   Fecha: ${purchaseDate}`)
  console.log(`   Pagado por: ${paidBy}`)
  console.log(`   Número de lote: ${lotNumber}`)
  console.log('')
  
  console.log('📦 Items a registrar:')
  console.log('')
  
  let totalLote = 0
  const byCategory = {}
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const totalValue = item.totalValue
    totalLote += totalValue
    
    // Agrupar por categoría
    if (!byCategory[item.category]) {
      byCategory[item.category] = { items: [], total: 0, count: 0 }
    }
    byCategory[item.category].items.push(item.name)
    byCategory[item.category].total += totalValue
    byCategory[item.category].count += item.quantity
    
    console.log(`${(i + 1).toString().padStart(2, ' ')}. ${item.name}`)
    console.log(`     Categoría: ${item.category}`)
    console.log(`     Cantidad: ${item.quantity} ${item.unit}`)
    console.log(`     Precio unitario: $${item.unitPrice.toLocaleString('es-CO')}`)
    console.log(`     Total: $${item.totalValue.toLocaleString('es-CO')}`)
    if (item.notes) {
      console.log(`     Notas: ${item.notes}`)
    }
    console.log('')
  }
  
  console.log(`💰 Valor total del lote: $${totalLote.toLocaleString('es-CO')}`)
  console.log('')
  
  // Mostrar resumen por categoría
  console.log('📂 Resumen por categoría:')
  Object.keys(byCategory).forEach(cat => {
    const catData = byCategory[cat]
    console.log(`   ${cat}:`)
    console.log(`     Items: ${catData.items.length} productos`)
    console.log(`     Cantidad total: ${catData.count} unidades`)
    console.log(`     Total categoría: $${catData.total.toLocaleString('es-CO')}`)
  })
  console.log('')
  
  console.log('📥 Agregando items a la base de datos...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const item of items) {
    try {
      const notes = item.notes 
        ? `Comprado en ${supplier} el ${purchaseDate}. Pagado por ${paidBy}. ${item.notes}`
        : `Comprado en ${supplier} el ${purchaseDate}. Pagado por ${paidBy}.`
      
      // Generar ID único
      const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      // Insertar en la base de datos
      const stmt = db.prepare(`
        INSERT INTO inventory (
          id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, unitPrice, totalValue,
          purchaseDate, lot, supplier, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        id,
        item.name,
        item.category,
        item.quantity,
        item.quantity, // initialQuantity
        item.unit,
        item.capacity || null,
        item.capacityUnit || null,
        item.unitPrice,
        item.totalValue,
        purchaseDate,
        lotNumber,
        supplier,
        notes,
        now,
        now
      )
      
      console.log(`   ✅ ${item.name} agregado correctamente`)
      successCount++
    } catch (error) {
      console.error(`   ❌ Error agregando ${item.name}:`, error.message)
      errorCount++
    }
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ PROCESO COMPLETADO')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log(`✅ Items agregados exitosamente: ${successCount}`)
  if (errorCount > 0) {
    console.log(`❌ Items con error: ${errorCount}`)
  }
  console.log(`💰 Valor total del lote: $${totalLote.toLocaleString('es-CO')}`)
  console.log(`🏷️  Número de lote: ${lotNumber}`)
  console.log(`📅 Fecha de compra: ${purchaseDate}`)
  console.log(`🏪 Proveedor: ${supplier}`)
  console.log(`👤 Pagado por: ${paidBy}`)
  console.log('')
  
} catch (error) {
  console.error('❌ Error agregando lote:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}
