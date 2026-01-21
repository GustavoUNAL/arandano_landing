/**
 * Script para registrar compras del sábado 17 de enero de 2026
 * Compró Mauricio Ortiz
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Función para buscar producto por nombre aproximado
function findProductByName(db, searchName) {
  const search = `%${searchName.toLowerCase()}%`
  
  let product = db.prepare(`
    SELECT id, name, price, category FROM products 
    WHERE LOWER(name) LIKE ? 
    ORDER BY 
      CASE WHEN LOWER(name) = LOWER(?) THEN 1 ELSE 2 END
    LIMIT 1
  `).get(search, searchName.toLowerCase())
  
  return product
}

// Función para crear item de inventario
function createInventoryItem(db, name, category, quantity, unit, unitPrice, totalValue, purchaseDate, supplier, notes) {
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO inventory (
      id, name, category, quantity, unit, unitPrice, totalValue,
      purchaseDate, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    category,
    quantity,
    unit,
    unitPrice,
    totalValue,
    purchaseDate,
    supplier || null,
    notes || null,
    now,
    now
  )
  
  return id
}

console.log('\n📦 Registrando compras del sábado 17 de enero de 2026...\n')
console.log('Proveedor: Mauricio Ortiz\n')

const purchaseDate = '2026-01-17'
const supplier = 'Mauricio Ortiz'

// 1. Hervido: 2 × $5.000 = $10.000
console.log('1️⃣  Hervido:')
const hervido = findProductByName(db, 'hervido')
if (hervido) {
  const id1 = createInventoryItem(
    db,
    hervido.name,
    hervido.category || 'cerveza',
    2,
    'unidad',
    5000,
    10000,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 2 unidades × $5.000 = $10.000`)
  console.log(`   📝 ID: ${id1}`)
} else {
  console.log('   ⚠️  Producto Hervido no encontrado, creando entrada genérica')
  const id1 = createInventoryItem(
    db,
    'Cerveza Hervido',
    'cerveza',
    2,
    'unidad',
    5000,
    10000,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 2 unidades × $5.000 = $10.000`)
  console.log(`   📝 ID: ${id1}`)
}

// 2. Poker 330: 7 × $4.500 = $31.500
console.log('\n2️⃣  Poker 330:')
const poker = findProductByName(db, 'poker 330')
if (poker) {
  const id2 = createInventoryItem(
    db,
    poker.name,
    poker.category || 'cerveza',
    7,
    'unidad',
    4500,
    31500,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 7 unidades × $4.500 = $31.500`)
  console.log(`   📝 ID: ${id2}`)
} else {
  console.log('   ⚠️  Producto Poker 330 no encontrado, creando entrada genérica')
  const id2 = createInventoryItem(
    db,
    'Cerveza Poker 330cm3',
    'cerveza',
    7,
    'unidad',
    4500,
    31500,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 7 unidades × $4.500 = $31.500`)
  console.log(`   📝 ID: ${id2}`)
}

// 3. Budweiser: 3 × $5.000 = $15.000
console.log('\n3️⃣  Budweiser:')
const budweiser = findProductByName(db, 'budweiser')
if (budweiser) {
  const id3 = createInventoryItem(
    db,
    budweiser.name,
    budweiser.category || 'cerveza',
    3,
    'unidad',
    5000,
    15000,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 3 unidades × $5.000 = $15.000`)
  console.log(`   📝 ID: ${id3}`)
} else {
  console.log('   ⚠️  Producto Budweiser no encontrado, creando entrada genérica')
  const id3 = createInventoryItem(
    db,
    'Cerveza Budweiser',
    'cerveza',
    3,
    'unidad',
    5000,
    15000,
    purchaseDate,
    supplier,
    'Compró Mauricio Ortiz'
  )
  console.log(`   ✅ 3 unidades × $5.000 = $15.000`)
  console.log(`   📝 ID: ${id3}`)
}

const totalCompra = 10000 + 31500 + 15000

console.log('\n📊 Resumen:')
console.log(`   Total compra: $${totalCompra.toLocaleString('es-CO')}`)

console.log('\n✅ Compras registradas exitosamente!\n')

db.close()
