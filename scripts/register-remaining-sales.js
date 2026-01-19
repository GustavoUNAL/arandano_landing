/**
 * Script para registrar las ventas faltantes de enero 2026
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Función helper para buscar producto
function findProductByName(db, searchName) {
  const search = `%${searchName.toLowerCase()}%`
  
  let product = db.prepare(`
    SELECT id, name, price FROM products 
    WHERE LOWER(name) LIKE ? 
    ORDER BY 
      CASE WHEN LOWER(name) = LOWER(?) THEN 1 ELSE 2 END
    LIMIT 1
  `).get(search, searchName.toLowerCase())
  
  if (!product) {
    if (searchName.toLowerCase().includes('budweiser') || searchName.toLowerCase().includes('cerveza')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE name LIKE '%Budweiser%' OR category = 'cerveza' LIMIT 1`).get()
    }
  }
  
  return product
}

// Crear venta
function createSale(db, date, hour, items, total, paymentMethod, notes) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO sales (id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    date,
    hour,
    JSON.stringify(items),
    total,
    paymentMethod || null,
    notes || null,
    now,
    now
  )
  
  return id
}

// Obtener un producto genérico como fallback
function getGenericProduct(db) {
  return db.prepare(`SELECT id, name, price FROM products LIMIT 1`).get()
}

console.log('\n💰 Registrando ventas faltantes de enero 2026...\n')

const genericProduct = getGenericProduct(db)

// 03/01/26: $69.000 (método no especificado)
console.log('📅 03/01/26: $69.000')
createSale(db, '2026-01-03', 14, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 69000 }
], 69000, null, 'Ver detalle')
console.log('   ✅ Venta registrada')

// 04/01/26: $64.000 (método no especificado)
console.log('\n📅 04/01/26: $64.000')
createSale(db, '2026-01-04', 15, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 64000 }
], 64000, null, 'Ver detalle')
console.log('   ✅ Venta registrada')

// 05/01/26: $196.000 (Nequi) - Venta Nequi – Mauricio Ortiz
console.log('\n📅 05/01/26: $196.000 (Nequi)')
createSale(db, '2026-01-05', 16, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 196000 }
], 196000, 'nequi', 'Venta Nequi – Mauricio Ortiz')
console.log('   ✅ Venta registrada')

// 06/01/26: $337.000 (método no especificado) - Incluye entrada Sebastián
console.log('\n📅 06/01/26: $337.000')
createSale(db, '2026-01-06', 18, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 337000 }
], 337000, null, 'Incluye entrada Sebastián')
console.log('   ✅ Venta registrada')

// 07/01/26: $15.000 (método no especificado)
console.log('\n📅 07/01/26: $15.000')
createSale(db, '2026-01-07', 12, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 15000 }
], 15000, null, 'Ver detalle')
console.log('   ✅ Venta registrada')

// 14/01/26: $77.000 (Nequi) - Cuadra con Nequi
console.log('\n📅 14/01/26: $77.000 (Nequi)')
createSale(db, '2026-01-14', 14, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 77000 }
], 77000, 'nequi', 'Cuadra con Nequi')
console.log('   ✅ Venta registrada')

// 15/01/26: $10.000 (método no especificado) - Budweiser
console.log('\n📅 15/01/26: $10.000 (Budweiser)')
const budweiser = findProductByName(db, 'Budweiser')
if (budweiser) {
  // Puede ser 2 unidades (2 x $3.500 = $7.000) o ajustar precio
  // Asumiendo 1 unidad con precio aproximado o 2 unidades
  const quantity = budweiser.price === 3500 ? 3 : 1 // 3 cervezas = $10.500 aprox
  createSale(db, '2026-01-15', 13, [
    { productId: budweiser.id, productName: budweiser.name, quantity: quantity, price: budweiser.price }
  ], 10000, null, 'Budweiser')
  console.log(`   ✅ Venta registrada (${budweiser.name})`)
} else {
  createSale(db, '2026-01-15', 13, [
    { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 10000 }
  ], 10000, null, 'Budweiser')
  console.log('   ✅ Venta registrada')
}

// 16/01/26: $20.000 (método no especificado)
console.log('\n📅 16/01/26: $20.000')
createSale(db, '2026-01-16', 15, [
  { productId: genericProduct.id, productName: genericProduct.name, quantity: 1, price: 20000 }
], 20000, null, 'Ver detalle')
console.log('   ✅ Venta registrada')

console.log('\n✅ Ventas faltantes registradas\n')

// Verificar totales por día
const totals = db.prepare(`
  SELECT 
    date,
    SUM(total) as total_dia,
    SUM(CASE WHEN paymentMethod = 'nequi' THEN total ELSE 0 END) as nequi,
    SUM(CASE WHEN paymentMethod = 'efectivo' THEN total ELSE 0 END) as efectivo,
    COUNT(*) as transacciones
  FROM sales
  GROUP BY date
  ORDER BY date
`).all()

console.log('📊 Resumen de ventas por día:\n')
totals.forEach(day => {
  const nequi = day.nequi || 0
  const efectivo = day.efectivo || 0
  const total = day.total_dia || 0
  const metodo = nequi > 0 && efectivo > 0 ? 'Nequi + Efectivo' :
                 nequi > 0 ? 'Nequi' :
                 efectivo > 0 ? 'Efectivo' : '—'
  
  console.log(`   ${day.date}: $${total.toLocaleString('es-CO')} (${metodo}) - ${day.transacciones} transacciones`)
})

const grandTotal = db.prepare('SELECT SUM(total) as total FROM sales').get()
console.log(`\n💰 Total general: $${(grandTotal.total || 0).toLocaleString('es-CO')}\n`)

db.close()
