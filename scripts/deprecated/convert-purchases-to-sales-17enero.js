/**
 * Script para convertir las compras del sábado 17 de enero en ventas
 * Dr. Pablo y Mauricio Ortiz fueron clientes, no proveedores
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Función para buscar producto por nombre
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

// Función para crear venta
function createSale(db, date, hour, items, total, paymentMethod, channel = 'presencial', comment = '') {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  // Formatear items según la estructura esperada
  const formattedItems = items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice || (item.unitPrice * item.quantity)
  }))
  
  // Verificar si la columna channel existe
  const tableInfo = db.prepare(`PRAGMA table_info(sales)`).all()
  const hasChannel = tableInfo.some(col => col.name === 'channel')
  
  if (hasChannel) {
    db.prepare(`
      INSERT INTO sales (id, date, hour, items, total, paymentMethod, channel, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      date,
      hour,
      JSON.stringify(formattedItems),
      total,
      paymentMethod || null,
      channel,
      now,
      now
    )
  } else {
    db.prepare(`
      INSERT INTO sales (id, date, hour, items, total, paymentMethod, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      date,
      hour,
      JSON.stringify(formattedItems),
      total,
      paymentMethod || null,
      now,
      now
    )
  }
  
  return id
}

console.log('\n💰 Convirtiendo compras del sábado 17 de enero en ventas...\n')

const purchaseDate = '2026-01-17'
const saleDate = '2026-01-17T20:00:00.000Z' // Sábado 17 de enero, 8 PM
const saleHour = 20

// ===== DR. PABLO =====
console.log('📅 Sábado 17 de enero - Dr. Pablo\n')

const drPabloPurchases = db.prepare("SELECT name, quantity, unitPrice, totalValue FROM inventory WHERE purchaseDate = ? AND supplier = 'Dr. Pablo' ORDER BY name").all(purchaseDate)

const drPabloItems = []
let drPabloTotal = 0

drPabloPurchases.forEach(purchase => {
  const product = findProductByName(db, purchase.name)
  
  if (product) {
    drPabloItems.push({
      productId: product.id,
      productName: product.name,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalValue
    })
    drPabloTotal += purchase.totalValue
    console.log(`   ✅ ${purchase.quantity}x ${product.name} - $${purchase.totalValue.toLocaleString('es-CO')}`)
  } else {
    // Si no encuentra el producto, crear entrada genérica
    drPabloItems.push({
      productId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productName: purchase.name,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalValue
    })
    drPabloTotal += purchase.totalValue
    console.log(`   ⚠️  ${purchase.quantity}x ${purchase.name} - $${purchase.totalValue.toLocaleString('es-CO')} (producto no encontrado, usando nombre genérico)`)
  }
})

// Para cigarrillos, el total pagado fue $1.500 pero el precio real es $1.000
// El total real de Dr. Pablo es $107.500 pero pagó $108.000 (incluye $500 de propina)
const drPabloTotalPagado = 108000

const sale1 = createSale(db, saleDate, saleHour, drPabloItems, drPabloTotalPagado, 'efectivo', 'presencial', 'Venta a Dr. Pablo')
console.log(`\n   💰 Total: $${drPabloTotalPagado.toLocaleString('es-CO')} (incluye $500 de propina en cigarrillos)`)
console.log(`   📝 ID de venta: ${sale1}\n`)

// ===== MAURICIO ORTIZ =====
console.log('📅 Sábado 17 de enero - Mauricio Ortiz\n')

const mauricioPurchases = db.prepare("SELECT name, quantity, unitPrice, totalValue FROM inventory WHERE purchaseDate = ? AND supplier = 'Mauricio Ortiz' ORDER BY name").all(purchaseDate)

const mauricioItems = []
let mauricioTotal = 0

mauricioPurchases.forEach(purchase => {
  const product = findProductByName(db, purchase.name)
  
  if (product) {
    mauricioItems.push({
      productId: product.id,
      productName: product.name,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalValue
    })
    mauricioTotal += purchase.totalValue
    console.log(`   ✅ ${purchase.quantity}x ${product.name} - $${purchase.totalValue.toLocaleString('es-CO')}`)
  } else {
    mauricioItems.push({
      productId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productName: purchase.name,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalValue
    })
    mauricioTotal += purchase.totalValue
    console.log(`   ⚠️  ${purchase.quantity}x ${purchase.name} - $${purchase.totalValue.toLocaleString('es-CO')} (producto no encontrado, usando nombre genérico)`)
  }
})

const sale2 = createSale(db, saleDate, saleHour + 1, mauricioItems, mauricioTotal, 'efectivo', 'presencial', 'Venta a Mauricio Ortiz')
console.log(`\n   💰 Total: $${mauricioTotal.toLocaleString('es-CO')}`)
console.log(`   📝 ID de venta: ${sale2}\n`)

console.log('✅ Ventas registradas exitosamente!\n')
console.log(`📊 Resumen:`)
console.log(`   Dr. Pablo: $${drPabloTotalPagado.toLocaleString('es-CO')}`)
console.log(`   Mauricio Ortiz: $${mauricioTotal.toLocaleString('es-CO')}`)
console.log(`   Total del día: $${(drPabloTotalPagado + mauricioTotal).toLocaleString('es-CO')}\n`)

db.close()
