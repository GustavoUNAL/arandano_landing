/**
 * Script para ajustar las ventas según el registro manual proporcionado
 * IMPORTANTE: Este script elimina ventas existentes y crea nuevas según el registro manual
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 AJUSTANDO VENTAS SEGÚN REGISTRO MANUAL\n')
console.log('═'.repeat(80))

// Obtener productos para poder buscar IDs
const products = db.prepare('SELECT id, name, price FROM products').all()

function findProductId(name) {
  // Mapear nombres del registro manual a productos en BD
  const nameLower = name.toLowerCase()
  
  // Buscar coincidencias parciales
  const match = products.find(p => {
    const pName = p.name.toLowerCase()
    if (nameLower.includes('café') && pName.includes('café')) return true
    if (nameLower.includes('poker') && pName.includes('poker')) return true
    if (nameLower.includes('budweiser') && pName.includes('budweiser')) return true
    if (nameLower.includes('heineken') && pName.includes('heineken')) return true
    if (nameLower.includes('moscow') && pName.includes('moscow')) return true
    if (nameLower.includes('hervido') && pName.includes('hervido')) return true
    if (nameLower.includes('carajillo') && pName.includes('carajillo')) return true
    if (nameLower.includes('combo') && pName.includes('combo')) return true
    if (nameLower.includes('shot') && pName.includes('shot')) return true
    if (nameLower.includes('cigarrillo') && pName.includes('cigarrillo')) return true
    if (nameLower.includes('pastel') && pName.includes('pastel')) return true
    if (nameLower.includes('leche') && pName.includes('leche')) return true
    if (nameLower.includes('sándwich') && pName.includes('sándwich')) return true
    if (nameLower.includes('galleta') && pName.includes('galleta')) return true
    if (nameLower.includes('acompañante') && pName.includes('acompañante')) return true
    return false
  })
  
  return match?.id || null
}

// Función para crear una venta
function createSale(date, hour, items, total, paymentMethod, comment) {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO sales (
      id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    date.toISOString(),
    hour,
    JSON.stringify(items),
    total,
    paymentMethod || null,
    comment || null,
    now,
    now
  )
  
  return id
}

// Eliminar ventas desde 30/12/25 en adelante para reconstruir
console.log('\n🗑️  Eliminando ventas desde 30/12/25...')
const deleted = db.prepare("DELETE FROM sales WHERE date >= '2025-12-30'").run()
console.log(`   ✅ Eliminadas ${deleted.changes} ventas\n`)

// Definir ventas según registro manual
const salesToCreate = [
  // 30/12/25
  { date: '2025-12-30', hour: 18, desc: 'Sixpack latón', total: 35000, pago: 'efectivo', items: [{ name: 'Cerveza Águila 330cm3', qty: 1, price: 35000 }], comment: 'Sixpack latón - $20.000 efectivo / $15.000 Nequi' },
  { date: '2025-12-30', hour: 20, desc: 'Cócteles (6)', total: 45000, pago: 'nequi', items: [{ name: 'Cóctel moscowmule', qty: 6, price: 7500 }], comment: 'Cócteles $7.500 c/u' },
  
  // 31/12/25
  { date: '2025-12-31', hour: 10, desc: 'Café', total: 5000, pago: 'efectivo', items: [{ name: 'Café negro artesanal', qty: 1, price: 5000 }] },
  
  // 03/01/26
  { date: '2026-01-03', hour: 14, desc: 'Combo café + pastel', total: 24000, items: [{ name: 'Café artesanal caliente + pastel del día', qty: 2, price: 12000 }] },
  { date: '2026-01-03', hour: 14, desc: 'Vaso de leche', total: 10000, items: [{ name: 'Vaso de leche', qty: 2, price: 5000 }] },
  { date: '2026-01-03', hour: 15, desc: 'Café', total: 5000, items: [{ name: 'Café negro artesanal', qty: 1, price: 5000 }], comment: 'Registrado como "Café"' },
  { date: '2026-01-03', hour: 16, desc: 'Moscow mule (2)', total: 20000, items: [{ name: 'Cóctel moscowmule', qty: 2, price: 10000 }], comment: '⚠️ No coincide con carta ($15.000 c/u)' },
  { date: '2026-01-03', hour: 17, desc: 'Canoca', total: 10000, items: [{ name: 'Canoca', qty: 1, price: 10000 }], comment: 'Valor no legible' },
  
  // 04/01/26
  { date: '2026-01-04', hour: 14, desc: 'Carajillo', total: 8000, items: [{ name: 'Carajillo', qty: 1, price: 8000 }] },
  { date: '2026-01-04', hour: 14, desc: 'Café soft brew', total: 12000, items: [{ name: 'Café soft brew', qty: 1, price: 12000 }], comment: 'No está en carta' },
  { date: '2026-01-04', hour: 15, desc: 'Café artesanal con leche', total: 5000, items: [{ name: 'Café artesanal caliente con leche', qty: 1, price: 5000 }], comment: 'Registrado como "Café con leche"' },
  { date: '2026-01-04', hour: 16, desc: 'Moscow mule', total: 15000, items: [{ name: 'Cóctel moscowmule', qty: 1, price: 15000 }] },
  { date: '2026-01-04', hour: 17, desc: 'Cervezas (mix) 3', total: 24000, items: [{ name: 'Cerveza Poker 330cm3', qty: 3, price: 8000 }], comment: '⚠️ No cuadra con carta' },
  
  // 05/01/26
  { date: '2026-01-05', hour: 18, desc: 'Venta Nequi Mauricio', total: 196000, pago: 'nequi', items: [{ name: 'Venta Nequi sin desglose', qty: 1, price: 196000 }], comment: 'Venta Nequi – Mauricio Ortiz' },
  
  // 06/01/26
  { date: '2026-01-06', hour: 10, desc: 'Carajillo', total: 8000, items: [{ name: 'Carajillo', qty: 1, price: 8000 }], comment: 'Registrado como "Carajillos"' },
  { date: '2026-01-06', hour: 11, desc: 'Combo café + pastel (2)', total: 24000, items: [{ name: 'Café artesanal caliente + pastel del día', qty: 2, price: 12000 }], comment: 'Registrado como "Combos"' },
  { date: '2026-01-06', hour: 12, desc: 'Café negro artesanal (4)', total: 20000, items: [{ name: 'Café negro artesanal', qty: 4, price: 5000 }], comment: '⚠️ valor no cuadra con carta' },
  { date: '2026-01-06', hour: 13, desc: 'Combo café + pastel', total: 12000, items: [{ name: 'Café artesanal caliente + pastel del día', qty: 1, price: 12000 }] },
  { date: '2026-01-06', hour: 14, desc: 'Café negro artesanal (2)', total: 8000, items: [{ name: 'Café negro artesanal', qty: 2, price: 4000 }] },
  { date: '2026-01-06', hour: 15, desc: 'Cócteles (2)', total: 30000, items: [{ name: 'Cóctel moscowmule', qty: 2, price: 15000 }] },
  { date: '2026-01-06', hour: 16, desc: 'Hervido (3)', total: 15000, items: [{ name: 'Hervido de fruta de temporada', qty: 3, price: 5000 }] },
  { date: '2026-01-06', hour: 17, desc: 'Cariocas (10)', total: 140000, items: [{ name: 'Cariocas', qty: 10, price: 14000 }], comment: 'No está en carta' },
  { date: '2026-01-06', hour: 18, desc: 'Entrada Nequi Sebastián', total: 80000, pago: 'nequi', items: [{ name: 'Entrada', qty: 1, price: 80000 }], comment: '✅ Confirmado como ENTRADA - Sebastián' },
  
  // 07/01/26
  { date: '2026-01-07', hour: 12, desc: 'Sándwich del día', total: 10000, items: [{ name: 'Sándwich del día', qty: 1, price: 10000 }] },
  { date: '2026-01-07', hour: 13, desc: 'Galleta', total: 1000, items: [{ name: 'Galleta', qty: 1, price: 1000 }], comment: 'No está en carta' },
  { date: '2026-01-07', hour: 14, desc: 'Café negro artesanal', total: 4000, items: [{ name: 'Café negro artesanal', qty: 1, price: 4000 }] },
  
  // 14/01/26
  { date: '2026-01-14', hour: 13, desc: 'Hervido (14)', total: 70000, items: [{ name: 'Hervido de fruta de temporada', qty: 14, price: 5000 }], comment: 'Ing industrial' },
  { date: '2026-01-14', hour: 14, desc: 'Pastel del día', total: 7000, items: [{ name: 'Pastel del día', qty: 1, price: 7000 }], comment: 'Ing industrial' },
  
  // 15/01/26
  { date: '2026-01-15', hour: 15, desc: 'Budweiser (2)', total: 10000, items: [{ name: 'Cerveza Budweiser', qty: 2, price: 5000 }], comment: 'Julian' },
  
  // 16/01/26
  { date: '2026-01-16', hour: 14, desc: 'Hervido', total: 5000, items: [{ name: 'Hervido de fruta de temporada', qty: 1, price: 5000 }] },
  { date: '2026-01-16', hour: 14, desc: 'Café negro artesanal', total: 4000, items: [{ name: 'Café negro artesanal', qty: 1, price: 4000 }] },
  { date: '2026-01-16', hour: 14, desc: 'Vaso de leche', total: 5000, items: [{ name: 'Vaso de leche', qty: 1, price: 5000 }] },
  { date: '2026-01-16', hour: 15, desc: 'Acompañante del día (2)', total: 6000, items: [{ name: 'Acompañante del día (Empanada, Buñuelo)', qty: 2, price: 3000 }], comment: 'Empanada / Buñuelo' },
  { date: '2026-01-16', hour: 20, desc: 'Poker 330 (4)', total: 14000, pago: 'efectivo', items: [{ name: 'Cerveza Poker 330cm3', qty: 4, price: 3500 }], comment: '$3.500 c/u - Sebastián Lugo' },
  
  // 17/01/26
  { date: '2026-01-17', hour: 20, desc: 'Hervido (2)', total: 10000, items: [{ name: 'Hervido de fruta de temporada', qty: 2, price: 5000 }], comment: 'Mauricio Ortiz' },
  { date: '2026-01-17', hour: 20, desc: 'Poker 330 (7)', total: 31500, items: [{ name: 'Cerveza Poker 330cm3', qty: 7, price: 4500 }], comment: '$4.500 c/u - Mauricio Ortiz' },
  { date: '2026-01-17', hour: 20, desc: 'Budweiser (3)', total: 15000, items: [{ name: 'Cerveza Budweiser', qty: 3, price: 5000 }], comment: 'Mauricio Ortiz' },
  { date: '2026-01-17', hour: 20, desc: 'Heineken (6)', total: 30000, items: [{ name: 'Cerveza Heineken', qty: 6, price: 5000 }], comment: 'Dr. Pablo' },
  { date: '2026-01-17', hour: 20, desc: 'Budweiser (3)', total: 15000, items: [{ name: 'Cerveza Budweiser', qty: 3, price: 5000 }], comment: 'Dr. Pablo' },
  { date: '2026-01-17', hour: 20, desc: 'Poker 330 (3)', total: 13500, items: [{ name: 'Cerveza Poker 330cm3', qty: 3, price: 4500 }], comment: '$4.500 c/u - Dr. Pablo' },
  { date: '2026-01-17', hour: 20, desc: 'Shots (4)', total: 48000, items: [{ name: 'Shot Tequila Olmeca', qty: 4, price: 12000 }], comment: '$12.000 c/u - Dr. Pablo' },
  { date: '2026-01-17', hour: 20, desc: 'Cigarrillo', total: 1000, items: [{ name: 'Cigarrillo', qty: 1, price: 1000 }], comment: 'Dr. Pablo' },
  { date: '2026-01-17', hour: 20, desc: 'Propina', total: 500, items: [{ name: 'Propina', qty: 1, price: 500 }], comment: 'Dr. Pablo' },
  
  // 18/01/26
  { date: '2026-01-18', hour: 20, desc: 'Poker 330 (3)', total: 10500, pago: 'efectivo', items: [{ name: 'Cerveza Poker 330cm3', qty: 3, price: 3500 }], comment: '$3.500 c/u - Sebastián Lugo' },
]

console.log(`\n➕ Creando ${salesToCreate.length} ventas según registro manual...\n`)

let created = 0
let errors = 0

salesToCreate.forEach((saleData, index) => {
  try {
    const date = new Date(saleData.date)
    // Ajustar hora para zona horaria Colombia (UTC-5)
    // Si la hora es 20 (8pm), convertir a UTC (1am del día siguiente)
    date.setUTCHours(saleData.hour - 5, 0, 0, 0)
    if (saleData.hour < 5) {
      date.setUTCDate(date.getUTCDate() - 1)
    }
    
    // Construir items buscando productos
    const items = saleData.items.map(itemData => {
      const productId = findProductId(itemData.name) || `product-${itemData.name.replace(/\s+/g, '-').toLowerCase()}`
      const product = products.find(p => p.id === productId) || { price: itemData.price }
      
      return {
        productId: productId,
        productName: itemData.name,
        quantity: itemData.qty,
        unitPrice: product.price || itemData.price,
        totalPrice: (product.price || itemData.price) * itemData.qty
      }
    })
    
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    
    createSale(
      date,
      saleData.hour,
      items,
      total,
      saleData.pago || null,
      saleData.comment || null
    )
    
    created++
    if ((index + 1) % 5 === 0) {
      console.log(`   ✅ Creadas ${index + 1}/${salesToCreate.length} ventas...`)
    }
  } catch (error) {
    console.error(`   ❌ Error creando venta ${index + 1}:`, error.message)
    errors++
  }
})

console.log(`\n✅ Proceso completado:`)
console.log(`   Ventas creadas: ${created}`)
console.log(`   Errores: ${errors}`)

// Verificar total
const finalSales = db.prepare("SELECT COUNT(*) as count, SUM(total) as total FROM sales WHERE date >= '2025-12-30'").get()
console.log(`\n📊 Verificación:`)
console.log(`   Total de ventas: ${finalSales.count}`)
console.log(`   Total vendido: $${(finalSales.total || 0).toLocaleString('es-CO')}`)
console.log(`\n`)

db.close()
