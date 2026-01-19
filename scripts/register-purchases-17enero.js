/**
 * Script para registrar compras del sábado 17 de enero de 2026
 * Compró el dr pablo
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
console.log('Proveedor: Dr. Pablo\n')

const purchaseDate = '2026-01-17'
const supplier = 'Dr. Pablo'

// 1. Heineken: 6 × $5.000 = $30.000
console.log('1️⃣  Heineken:')
const heineken = findProductByName(db, 'heineken')
if (heineken) {
  const id1 = createInventoryItem(
    db,
    heineken.name,
    heineken.category || 'cerveza',
    6,
    'unidad',
    5000,
    30000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 6 unidades × $5.000 = $30.000`)
  console.log(`   📝 ID: ${id1}`)
} else {
  console.log('   ⚠️  Producto Heineken no encontrado, creando entrada genérica')
  const id1 = createInventoryItem(
    db,
    'Cerveza Heineken',
    'cerveza',
    6,
    'unidad',
    5000,
    30000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 6 unidades × $5.000 = $30.000`)
  console.log(`   📝 ID: ${id1}`)
}

// 2. Budweiser: 3 × $5.000 = $15.000
console.log('\n2️⃣  Budweiser:')
const budweiser = findProductByName(db, 'budweiser')
if (budweiser) {
  const id2 = createInventoryItem(
    db,
    budweiser.name,
    budweiser.category || 'cerveza',
    3,
    'unidad',
    5000,
    15000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 3 unidades × $5.000 = $15.000`)
  console.log(`   📝 ID: ${id2}`)
} else {
  console.log('   ⚠️  Producto Budweiser no encontrado, creando entrada genérica')
  const id2 = createInventoryItem(
    db,
    'Cerveza Budweiser',
    'cerveza',
    3,
    'unidad',
    5000,
    15000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 3 unidades × $5.000 = $15.000`)
  console.log(`   📝 ID: ${id2}`)
}

// 3. Poker 330: 3 × $4.500 = $13.500
console.log('\n3️⃣  Poker 330:')
const poker = findProductByName(db, 'poker 330')
if (poker) {
  const id3 = createInventoryItem(
    db,
    poker.name,
    poker.category || 'cerveza',
    3,
    'unidad',
    4500,
    13500,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 3 unidades × $4.500 = $13.500`)
  console.log(`   📝 ID: ${id3}`)
} else {
  console.log('   ⚠️  Producto Poker 330 no encontrado, creando entrada genérica')
  const id3 = createInventoryItem(
    db,
    'Cerveza Poker 330cm3',
    'cerveza',
    3,
    'unidad',
    4500,
    13500,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 3 unidades × $4.500 = $13.500`)
  console.log(`   📝 ID: ${id3}`)
}

// 4. Shots: 4 × $12.000 = $48.000
console.log('\n4️⃣  Shots:')
const shot = findProductByName(db, 'shot')
if (shot) {
  const id4 = createInventoryItem(
    db,
    shot.name,
    shot.category || 'bebida',
    4,
    'unidad',
    12000,
    48000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 4 unidades × $12.000 = $48.000`)
  console.log(`   📝 ID: ${id4}`)
} else {
  console.log('   ⚠️  Producto Shot no encontrado, creando entrada genérica')
  const id4 = createInventoryItem(
    db,
    'Shot',
    'bebida',
    4,
    'unidad',
    12000,
    48000,
    purchaseDate,
    supplier,
    'Compró el dr pablo'
  )
  console.log(`   ✅ 4 unidades × $12.000 = $48.000`)
  console.log(`   📝 ID: ${id4}`)
}

// 5. Cigarrillos: 1 × $1.500 (pero precio real es $1.000, $500 es propina)
console.log('\n5️⃣  Cigarrillos:')
const cigarrillo = findProductByName(db, 'cigarrillo')
const precioRealCigarrillo = 1000
const precioPagado = 1500
const propina = precioPagado - precioRealCigarrillo

if (cigarrillo) {
  const id5 = createInventoryItem(
    db,
    cigarrillo.name,
    cigarrillo.category || 'otros',
    1,
    'unidad',
    precioRealCigarrillo, // Precio real del producto
    precioRealCigarrillo, // Valor total real
    purchaseDate,
    supplier,
    `Compró el dr pablo. Precio pagado: $${precioPagado.toLocaleString('es-CO')}, propina: $${propina.toLocaleString('es-CO')}`
  )
  console.log(`   ✅ 1 unidad × $${precioRealCigarrillo.toLocaleString('es-CO')} = $${precioRealCigarrillo.toLocaleString('es-CO')}`)
  console.log(`   💰 Precio pagado: $${precioPagado.toLocaleString('es-CO')} (incluye propina de $${propina.toLocaleString('es-CO')})`)
  console.log(`   📝 ID: ${id5}`)
} else {
  console.log('   ⚠️  Producto Cigarrillo no encontrado, creando entrada genérica')
  const id5 = createInventoryItem(
    db,
    'Cigarrillo',
    'otros',
    1,
    'unidad',
    precioRealCigarrillo,
    precioRealCigarrillo,
    purchaseDate,
    supplier,
    `Compró el dr pablo. Precio pagado: $${precioPagado.toLocaleString('es-CO')}, propina: $${propina.toLocaleString('es-CO')}`
  )
  console.log(`   ✅ 1 unidad × $${precioRealCigarrillo.toLocaleString('es-CO')} = $${precioRealCigarrillo.toLocaleString('es-CO')}`)
  console.log(`   💰 Precio pagado: $${precioPagado.toLocaleString('es-CO')} (incluye propina de $${propina.toLocaleString('es-CO')})`)
  console.log(`   📝 ID: ${id5}`)
}

const totalCompra = 30000 + 15000 + 13500 + 48000 + precioRealCigarrillo
const totalPagado = 30000 + 15000 + 13500 + 48000 + precioPagado

console.log('\n📊 Resumen:')
console.log(`   Total compra (sin propina): $${totalCompra.toLocaleString('es-CO')}`)
console.log(`   Total pagado (con propina): $${totalPagado.toLocaleString('es-CO')}`)
console.log(`   Propina incluida: $${propina.toLocaleString('es-CO')}`)

console.log('\n✅ Compras registradas exitosamente!\n')

db.close()
