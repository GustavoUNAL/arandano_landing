#!/usr/bin/env node

/**
 * Script para agregar lote de Dollarcity - Tienda 3057 (Unico Pasto)
 * Factura: F1L11300084
 * Fecha: 2026-01-17 17:37:10
 * Cliente: Sonia Herrera
 * Documento: 59833986
 * Forma de pago: Contado – Tarjeta
 * 
 * Uso: node scripts/add-dollarcity-lot-17enero.js
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
const purchaseDate = '2026-01-17'
const lotNumber = `DOLLARCITY-${purchaseDate.replace(/-/g, '')}-F1L11300084`
const supplier = 'Dollarcity – Tienda 3057 (Unico Pasto)'
const invoiceNumber = 'F1L11300084'
const clientName = 'Sonia Herrera'
const clientDocument = '59833986'
const paymentMethod = 'Contado – Tarjeta'

// Función para convertir números con formato colombiano (puntos como separadores de miles)
function parseColombianNumber(str) {
  if (typeof str === 'number') return str
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}

// Items del lote
const items = [
  {
    code: '230616003996',
    name: 'Copa de vino 3PK',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12000'),
    base: parseColombianNumber('10084.03'),
    iva: parseColombianNumber('1915.97'),
    total: parseColombianNumber('12000')
  },
  {
    code: '5052',
    name: 'Bolsa ecológica DC grande',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('2000'),
    base: parseColombianNumber('1680.67'),
    iva: parseColombianNumber('319.33'),
    total: parseColombianNumber('2000')
  },
  {
    code: '667888020843',
    name: 'Jarra con tapa color 1L',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12000'),
    base: parseColombianNumber('10084.03'),
    iva: parseColombianNumber('1915.97'),
    total: parseColombianNumber('12000')
  },
  {
    code: '667888208043',
    name: 'Perchas de alambre',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('8000'),
    base: parseColombianNumber('6722.69'),
    iva: parseColombianNumber('1277.31'),
    total: parseColombianNumber('8000')
  },
  {
    code: '667888292172',
    name: 'Frasco vidrio con tapa',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('14000'),
    base: parseColombianNumber('11764.71'),
    iva: parseColombianNumber('2235.29'),
    total: parseColombianNumber('14000')
  },
  {
    code: '667888357796',
    name: 'Delantal poliéster cocina',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('14000'),
    base: parseColombianNumber('11764.71'),
    iva: parseColombianNumber('2235.29'),
    total: parseColombianNumber('14000')
  },
  {
    code: '667888424801',
    name: 'Dispensador plástico cromado',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('16000'),
    base: parseColombianNumber('13445.38'),
    iva: parseColombianNumber('2554.62'),
    total: parseColombianNumber('16000')
  },
  {
    code: '667888430918',
    name: 'Maceta grande plástica (x2)',
    category: 'activos',
    quantity: 2,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('16000'),
    base: parseColombianNumber('13445.38'),
    iva: parseColombianNumber('2554.62'),
    total: parseColombianNumber('32000')
  },
  {
    code: '667888564521',
    name: 'Cucharas plásticas bolsa',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('5000'),
    base: parseColombianNumber('4201.68'),
    iva: parseColombianNumber('798.32'),
    total: parseColombianNumber('5000')
  },
  {
    code: '667888604470',
    name: 'Contenedor vidrio mosaico',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('12000'),
    base: parseColombianNumber('10084.03'),
    iva: parseColombianNumber('1915.97'),
    total: parseColombianNumber('12000')
  },
  {
    code: '7702174082785',
    name: 'Gomitas Trolli',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: parseColombianNumber('8000'),
    base: parseColombianNumber('6722.69'),
    iva: parseColombianNumber('1277.31'),
    total: parseColombianNumber('8000')
  }
]

try {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  AGREGANDO LOTE DE DOLLARCITY AL INVENTARIO')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  console.log('📋 Información de la factura:')
  console.log(`   Empresa: ${supplier}`)
  console.log(`   Factura: ${invoiceNumber}`)
  console.log(`   Fecha: ${purchaseDate} 17:37:10`)
  console.log(`   Cliente: ${clientName}`)
  console.log(`   Documento: ${clientDocument}`)
  console.log(`   Forma de pago: ${paymentMethod}`)
  console.log(`   Número de lote: ${lotNumber}`)
  console.log('')
  
  console.log('📦 Items a registrar:')
  console.log('')
  
  let totalLote = 0
  const byCategory = {}
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const totalValue = item.quantity * item.unitPrice
    totalLote += totalValue
    
    // Agrupar por categoría
    if (!byCategory[item.category]) {
      byCategory[item.category] = { items: [], total: 0, count: 0 }
    }
    byCategory[item.category].items.push(item.name)
    byCategory[item.category].total += totalValue
    byCategory[item.category].count += item.quantity
    
    console.log(`${(i + 1).toString().padStart(2, ' ')}. ${item.name}`)
    console.log(`     Código: ${item.code}`)
    console.log(`     Categoría: ${item.category}`)
    console.log(`     Cantidad: ${item.quantity} ${item.unit}`)
    console.log(`     Precio unitario: $${item.unitPrice.toLocaleString('es-CO')}`)
    console.log(`     Base: $${item.base.toLocaleString('es-CO')}`)
    console.log(`     IVA: $${item.iva.toLocaleString('es-CO')}`)
    console.log(`     Total: $${item.total.toLocaleString('es-CO')}`)
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
      const totalValue = item.quantity * item.unitPrice
      const notes = `Factura ${invoiceNumber} - ${supplier}. Cliente: ${clientName} (${clientDocument}). Forma de pago: ${paymentMethod}. Base: $${item.base.toLocaleString('es-CO')}, IVA: $${item.iva.toLocaleString('es-CO')}`
      
      // Generar ID único
      const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      // Insertar en la base de datos
      const stmt = db.prepare(`
        INSERT INTO inventory (
          id, name, category, quantity, initialQuantity, unit, unitPrice, totalValue,
          code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        id,
        item.name,
        item.category,
        item.quantity,
        item.quantity, // initialQuantity
        item.unit,
        item.unitPrice,
        totalValue,
        item.code,
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
  console.log('')
  
} catch (error) {
  console.error('❌ Error agregando lote:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}
