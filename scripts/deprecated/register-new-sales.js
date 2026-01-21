/**
 * Script para registrar nuevas ventas:
 * - Viernes 16 de enero: 4 cervezas Poker - $24.500
 * - Domingo 18 de enero (hoy): 3 cervezas Poker
 * Ajusta precios y agrega cigarrillos si sobra dinero
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// Función helper para buscar producto por nombre aproximado
function findProductByName(db, searchName) {
  const search = `%${searchName.toLowerCase()}%`
  
  // Buscar coincidencias exactas primero
  let product = db.prepare(`
    SELECT id, name, price FROM products 
    WHERE LOWER(name) LIKE ? 
    ORDER BY 
      CASE WHEN LOWER(name) = LOWER(?) THEN 1 ELSE 2 END
    LIMIT 1
  `).get(search, searchName.toLowerCase())
  
  if (!product) {
    // Buscar por categoría si no se encuentra
    if (searchName.toLowerCase().includes('cerveza') || searchName.toLowerCase().includes('poker')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE category = 'cerveza' AND LOWER(name) LIKE '%poker%' LIMIT 1`).get()
    }
  }
  
  return product
}

// Función para buscar o crear producto cigarrillo
function findOrCreateCigarrillo(db) {
  let cigarrillo = findProductByName(db, 'cigarrillo')
  
  if (!cigarrillo) {
    // Crear producto cigarrillo
    const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    db.prepare(`
      INSERT INTO products (
        id, name, price, description, category, type, stock, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'Cigarrillo',
      1000,
      'Cigarrillo individual',
      'otros',
      'bebida',
      0,
      now,
      now
    )
    
    cigarrillo = { id, name: 'Cigarrillo', price: 1000 }
    console.log(`   ✅ Producto creado: Cigarrillo - $1.000`)
  }
  
  return cigarrillo
}

// Crear venta
function createSale(db, date, hour, items, total, paymentMethod, channel = 'presencial') {
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

console.log('\n💰 Registrando nuevas ventas con precios ajustados...\n')

// Buscar producto Cerveza Poker
const poker = findProductByName(db, 'cerveza poker')
if (!poker) {
  console.error('❌ No se encontró producto: Cerveza Poker')
  console.log('Productos disponibles con "poker":')
  const allPoker = db.prepare(`SELECT id, name, price FROM products WHERE LOWER(name) LIKE '%poker%'`).all()
  console.log(JSON.stringify(allPoker, null, 2))
  process.exit(1)
}

console.log(`✅ Producto encontrado: ${poker.name} (ID: ${poker.id}, Precio: $${poker.price.toLocaleString('es-CO')})\n`)

// Buscar o crear cigarrillo
const cigarrillo = findOrCreateCigarrillo(db)
console.log(`✅ Cigarrillo: $${cigarrillo.price.toLocaleString('es-CO')} c/u\n`)

// Usar el precio REAL del producto
const precioCerveza = poker.price // $3.500

// ===== Viernes 16 de enero de 2026 =====
console.log('📅 Viernes 16 de enero de 2026')

// 4 cervezas Poker - $24.500 total
const total16 = 24500
const cervezas16 = 4
const totalCervezas16 = precioCerveza * cervezas16
const sobra16 = total16 - totalCervezas16

const items16 = [
  {
    productId: poker.id,
    productName: poker.name,
    quantity: cervezas16,
    unitPrice: precioCerveza,
    totalPrice: totalCervezas16
  }
]

// Agregar cigarrillos con el dinero sobrante
if (sobra16 > 0) {
  const cantidadCigarrillos16 = Math.floor(sobra16 / cigarrillo.price)
  if (cantidadCigarrillos16 > 0) {
    items16.push({
      productId: cigarrillo.id,
      productName: cigarrillo.name,
      quantity: cantidadCigarrillos16,
      unitPrice: cigarrillo.price,
      totalPrice: cantidadCigarrillos16 * cigarrillo.price
    })
    console.log(`   ✅ ${cantidadCigarrillos16} cigarrillo(s): $${(cantidadCigarrillos16 * cigarrillo.price).toLocaleString('es-CO')}`)
  }
}

// Eliminar venta anterior si existe
const oldSale1 = db.prepare("SELECT id FROM sales WHERE date LIKE '2026-01-16%' AND total = 24500 LIMIT 1").get()
if (oldSale1) {
  db.prepare('DELETE FROM sales WHERE id = ?').run(oldSale1.id)
  console.log(`   🗑️  Eliminada venta anterior`)
}

const sale1 = createSale(db, '2026-01-16T20:00:00.000Z', 20, items16, total16, 'efectivo', 'presencial')

console.log(`   ✅ 4 cervezas Poker: $${totalCervezas16.toLocaleString('es-CO')} (Precio unitario: $${precioCerveza.toLocaleString('es-CO')})`)
console.log(`   💰 Total: $${total16.toLocaleString('es-CO')}`)
console.log(`   📝 ID de venta: ${sale1}\n`)

// ===== Domingo 18 de enero de 2026 (hoy) =====
console.log('📅 Domingo 18 de enero de 2026 (hoy)')

// 3 cervezas Poker - necesitamos el total pagado
// Por ahora calculamos solo las cervezas, pero si hay un total específico se ajusta
const cervezas18 = 3
const totalCervezas18 = precioCerveza * cervezas18

// Si no se especifica total, solo cervezas. Si hay total mayor, agregar cigarrillos
// Por defecto: solo cervezas
const total18 = totalCervezas18

const items18 = [
  {
    productId: poker.id,
    productName: poker.name,
    quantity: cervezas18,
    unitPrice: precioCerveza,
    totalPrice: totalCervezas18
  }
]

// Si hay un total mayor al de las cervezas, agregar cigarrillos
const sobra18 = total18 - totalCervezas18
if (sobra18 > 0) {
  const cantidadCigarrillos18 = Math.floor(sobra18 / cigarrillo.price)
  if (cantidadCigarrillos18 > 0) {
    items18.push({
      productId: cigarrillo.id,
      productName: cigarrillo.name,
      quantity: cantidadCigarrillos18,
      unitPrice: cigarrillo.price,
      totalPrice: cantidadCigarrillos18 * cigarrillo.price
    })
    console.log(`   ✅ ${cantidadCigarrillos18} cigarrillo(s): $${(cantidadCigarrillos18 * cigarrillo.price).toLocaleString('es-CO')}`)
  }
}

// Eliminar venta anterior si existe
const oldSale2 = db.prepare("SELECT id FROM sales WHERE date LIKE '2026-01-19%' AND total = 18.375 LIMIT 1").get()
if (oldSale2) {
  db.prepare('DELETE FROM sales WHERE id = ?').run(oldSale2.id)
  console.log(`   🗑️  Eliminada venta anterior`)
}

const sale2 = createSale(db, new Date().toISOString(), new Date().getHours(), items18, total18, 'efectivo', 'presencial')

console.log(`   ✅ 3 cervezas Poker: $${totalCervezas18.toLocaleString('es-CO')} (Precio unitario: $${precioCerveza.toLocaleString('es-CO')})`)
console.log(`   💰 Total: $${total18.toLocaleString('es-CO')}`)
console.log(`   📝 ID de venta: ${sale2}\n`)

console.log('✅ Ventas registradas exitosamente!\n')
console.log('📌 Nota: Si el total del domingo fue diferente, ajusta el script con el total correcto.\n')

db.close()
