/**
 * Script para registrar las ventas de diciembre 2025
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
    if (searchName.toLowerCase().includes('sixpack') || searchName.toLowerCase().includes('cerveza')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE category = 'cerveza' LIMIT 1`).get()
    } else if (searchName.toLowerCase().includes('cóctel') || searchName.toLowerCase().includes('coctel')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE category = 'coctel' LIMIT 1`).get()
    } else if (searchName.toLowerCase().includes('café') || searchName.toLowerCase().includes('cafe')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE category = 'cafe-caliente' LIMIT 1`).get()
    } else if (searchName.toLowerCase().includes('combo')) {
      product = db.prepare(`SELECT id, name, price FROM products WHERE category = 'combo' LIMIT 1`).get()
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

console.log('\n💰 Registrando ventas de diciembre 2025...\n')

// ===== 30/12/25 =====
console.log('📅 30/12/25')

// 1. Sixpack latón - $35.000 (Efectivo $20.000 + Nequi $15.000)
const sixpack = findProductByName(db, 'sixpack')
if (!sixpack) {
  console.error('❌ No se encontró producto: Sixpack latón')
} else {
  // Crear dos ventas separadas para los métodos de pago
  // Ventas parciales - una por método de pago
  createSale(db, '2025-12-30', 18, [
    { productId: sixpack.id, productName: sixpack.name, quantity: 1, price: 20000 }
  ], 20000, 'efectivo', 'Parte de sixpack latón')
  
  createSale(db, '2025-12-30', 18, [
    { productId: sixpack.id, productName: sixpack.name, quantity: 1, price: 15000 }
  ], 15000, 'nequi', 'Parte de sixpack latón')
  
  console.log(`   ✅ Sixpack latón: $35.000 (Efectivo $20.000 + Nequi $15.000)`)
}

// 2. Cócteles - 6 unidades a $7.500 c/u = $45.000 (Nequi)
const coctel = findProductByName(db, 'cóctel')
if (!coctel) {
  console.error('❌ No se encontró producto: Cócteles')
} else {
  createSale(db, '2025-12-30', 20, [
    { productId: coctel.id, productName: coctel.name, quantity: 6, price: 7500 }
  ], 45000, 'nequi')
  
  console.log(`   ✅ Cócteles: 6 unidades x $7.500 = $45.000 (Nequi)`)
}

console.log('   👉 Total día 30/12/25: $80.000\n')

// ===== 31/12/25 =====
console.log('📅 31/12/25')

// 1. Café - $5.000 (Efectivo)
const cafe = findProductByName(db, 'café negro')
if (!cafe) {
  // Intentar otro café
  const cafeAlt = findProductByName(db, 'café')
  if (cafeAlt) {
    createSale(db, '2025-12-31', 10, [
      { productId: cafeAlt.id, productName: cafeAlt.name, quantity: 1, price: 5000 }
    ], 5000, 'efectivo')
    console.log(`   ✅ Café: $5.000 (Efectivo)`)
  } else {
    console.error('❌ No se encontró producto: Café')
  }
} else {
  createSale(db, '2025-12-31', 10, [
    { productId: cafe.id, productName: cafe.name, quantity: 1, price: 5000 }
  ], 5000, 'efectivo')
  console.log(`   ✅ Café: $5.000 (Efectivo)`)
}

// 2. Combos - 4 unidades a $13.000 c/u = $52.000 (Nequi)
const combo = findProductByName(db, 'combo')
if (!combo) {
  console.error('❌ No se encontró producto: Combos')
} else {
  createSale(db, '2025-12-31', 12, [
    { productId: combo.id, productName: combo.name, quantity: 4, price: 13000 }
  ], 52000, 'nequi')
  
  console.log(`   ✅ Combos: 4 unidades x $13.000 = $52.000 (Nequi)`)
}

console.log('   👉 Total día 31/12/25: $57.000\n')

// Verificar ventas registradas
const totalSales = db.prepare('SELECT COUNT(*) as count, SUM(total) as total FROM sales').get()
console.log(`✅ Ventas registradas: ${totalSales.count}`)
console.log(`💰 Total registrado: $${totalSales.total || 0}\n`)

db.close()
