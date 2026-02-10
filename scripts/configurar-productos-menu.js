/**
 * Configura todos los productos a la venta: nombre, precio, categoría, tipo y tamaño/volumen.
 * Actualiza existentes por id e inserta los que falten.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

// [ id (existente) o null, name, price, category, type, size ]
const PRODUCTS = [
  ['cafe-negro', 'Café negro artesanal', 4000, 'cafe-caliente', 'cafeteria', '240 ml'],
  ['cafe-aromatizado', 'Café aromatizado artesanal (canela o vainilla)', 5000, 'cafe-caliente', 'cafeteria', '240 ml'],
  ['cafe-leche', 'Café artesanal con leche', 5000, 'cafe-caliente', 'cafeteria', '240 ml'],
  ['cafe-irlandes', 'Café irlandés', 10000, 'cafe-caliente', 'cafeteria', '240 ml'],
  ['carajillo', 'Carajillo', 8000, 'cafe-caliente', 'cafeteria', '180 ml'],
  ['vaso-leche', 'Vaso de leche caliente', 5000, 'cafe-caliente', 'cafeteria', '200 ml'],
  ['cafe-frio', 'Café frío artesanal', 4000, 'cafe-frio', 'cafeteria', '355 ml'],
  ['cafe-frio-leche', 'Café frío artesanal con leche', 5000, 'cafe-frio', 'cafeteria', '355 ml'],
  ['cafe-helado', 'Café helado artesanal (affogato)', 10000, 'cafe-frio', 'cafeteria', '355 ml'],
  ['acompanante', 'Acompañante del día (empanada o buñuelo)', 3000, 'pasteleria', 'cafeteria', '1 unidad'],
  ['pastel-dia', 'Pastel del día', 7000, 'pasteleria', 'cafeteria', '1 unidad'],
  ['sandwich-dia', 'Sándwich del día', 10000, 'pasteleria', 'cafeteria', '1 unidad'],
  ['cerveza-aguila-330', 'Cerveza Águila', 3500, 'cerveza', 'bebida', '330 ml'],
  ['cerveza-poker-330', 'Cerveza Poker', 3500, 'cerveza', 'bebida', '330 ml'],
  ['cerveza-budweiser', 'Cerveza Budweiser', 3500, 'cerveza', 'bebida', '330 ml'],
  ['cerveza-club-colombia-330', 'Cerveza Club Colombia', 4000, 'cerveza', 'bebida', '330 ml'],
  ['cerveza-poker-laton', 'Cerveza Poker Latón', 5500, 'cerveza', 'bebida', '475 ml'],
  ['cerveza-coronita', 'Cerveza Coronita', 5000, 'cerveza', 'bebida', '210 ml'],
  ['cerveza-heineken', 'Cerveza Heineken', 5000, 'cerveza', 'bebida', '330 ml'],
  ['prod-1770687422697-b37kcnnmy', 'Cerveza Poker botella grande', 7000, 'cerveza', 'bebida', '750 ml'],
  ['prod-1770687422697-le373wgmo', 'Cerveza michelada', 7000, 'cerveza', 'bebida', '330 ml'],
  ['coctel-arandano', 'Cóctel de arándano', 15000, 'coctel', 'bebida', '250 ml'],
  ['bebida-1767478463497-c2aya0ta0', 'Cóctel de Campari', 15000, 'coctel', 'bebida', '250 ml'],
  ['bebida-1767479422734-8ofoa07j2', 'Cóctel de soda sin licor', 15000, 'coctel', 'bebida', '250 ml'],
  ['bebida-1767478306369-c8s8nr6nh', 'Moscow Mule', 15000, 'coctel', 'bebida', '300 ml'],
  ['bebida-1767479680271-wp5qa9j7m', 'Margarita', 15000, 'coctel', 'bebida', '250 ml'],
  ['bebida-1767479537737-5pcmv20sn', 'Hervido de fruta de temporada', 7000, 'coctel', 'bebida', '300 ml'],
  ['vino-caliente', 'Vino caliente', 10000, 'coctel', 'bebida', '200 ml'],
  ['bebida-1767478125019-7gnyg8glz', 'Copa de vino', 10000, 'vino', 'bebida', '150 ml'],
  ['vino-tinto-botella', 'Botella vino tinto Santa Helena', 75000, 'vino', 'bebida', '750 ml'],
  ['prod-1768501042805-nuujaxetr', 'Aguardiente Amarillo', 70000, 'aguardiente', 'bebida', '750 ml'],
  ['prod-1768501043986-dzy4iyvgk', 'Aguardiente Nariño', 70000, 'aguardiente', 'bebida', '750 ml'],
  ['vodka-smirnoff-botella', 'Vodka Smirnoff Tamarindo', 70000, 'vodka', 'bebida', '750 ml'],
  ['gin-gordons-botella', "Ginebra Gordon's", 110000, 'ginebra', 'bebida', '750 ml'],
  ['gin-beefeater-botella', 'Ginebra Beefeater', 130000, 'ginebra', 'bebida', '750 ml'],
  ['tequila-olmeca-botella', 'Tequila Olmeca', 130000, 'tequila', 'bebida', '750 ml'],
  ['tequila-jose-cuervo-botella', 'Tequila José Cuervo Especial', 160000, 'tequila', 'bebida', '750 ml'],
  [null, 'Whisky Old Parr', 180000, 'whisky', 'bebida', '750 ml'],
  ['gin-gordons-shot', 'Shot ginebra', 12000, 'ginebra', 'bebida', '30 ml'],
  ['vodka-smirnoff-shot', 'Shot vodka Smirnoff', 7000, 'vodka', 'bebida', '30 ml'],
  ['vodka-skyy-botella', 'Shot vodka', 12000, 'vodka', 'bebida', '30 ml'],
  ['tequila-olmeca-shot', 'Shot tequila', 12000, 'tequila', 'bebida', '30 ml'],
  ['whisky-old-parr-shot', 'Shot whisky', 12000, 'whisky', 'bebida', '30 ml'],
  [null, 'Shot brandy', 7000, 'brandy', 'bebida', '30 ml'],
  [null, 'Shot aguardiente', 7000, 'aguardiente', 'bebida', '30 ml'],
  [null, 'Shot ron', 7000, 'ron', 'bebida', '30 ml'],
  ['prod-1768843715583-n44rw1kv2', 'Cigarrillo', 1000, 'otros', 'producto', '1 unidad'],
  ['combo-cafe-pastel', 'Combo café caliente + pastel', 12000, 'combo', 'cafeteria', '240 ml + 1 unidad'],
  ['combo-promo-1770687557739-00-g0ou7i', 'Lunes mañana café negro + snack', 5000, 'combo', 'cafeteria', '240 ml + 1 unidad'],
  ['combo-promo-1770687557773-01-ikv3g5', 'Lunes tarde café frío + pastel', 10000, 'combo', 'cafeteria', '355 ml + 1 unidad'],
  ['combo-promo-1770687557773-02-nc0yjx', 'Martes mañana café negro promo', 3000, 'combo', 'cafeteria', '240 ml'],
  ['combo-promo-1770687557773-03-sgx4xt', 'Martes tarde café aromatizado + snack', 6000, 'combo', 'cafeteria', '240 ml + 1 unidad'],
  ['combo-promo-1770687557774-04-tghq3m', 'Miércoles mañana café + snack', 6000, 'combo', 'cafeteria', '240 ml + 1 unidad'],
  ['combo-promo-1770687557774-05-po8obp', 'Miércoles tarde sándwich + café', 12000, 'combo', 'cafeteria', '1 unidad + 240 ml'],
  ['combo-promo-1770687557774-06-d5gj44', 'Jueves noche affogato especial', 9500, 'combo', 'cafeteria', '355 ml'],
  ['combo-promo-1770687557774-07-gkk8c2', 'Jueves cócteles 2x1', 15000, 'combo', 'cafeteria', '2 x 250 ml'],
  ['combo-promo-1770687557774-08-2bekcw', 'Jueves 3 cervezas micheladas', 15000, 'combo', 'cafeteria', '3 x 330 ml'],
  ['combo-promo-1770687557774-10-34stm4', 'Viernes cóctel + salatines', 17000, 'combo', 'cafeteria', '250 ml + 1 unidad'],
  ['combo-promo-1770687557775-13-3g76zj', 'Sábado 2 cócteles', 28000, 'combo', 'cafeteria', '2 x 250 ml'],
  ['combo-promo-1770687557775-14-9ugtfl', 'Sábado 3 cervezas', 16000, 'combo', 'cafeteria', '3 x 330 ml'],
]

const updateStmt = db.prepare(`
  UPDATE products SET name = ?, price = ?, category = ?, type = ?, size = ?, updatedAt = ? WHERE id = ?
`)

const insertStmt = db.prepare(`
  INSERT INTO products (id, name, price, description, category, type, stock, size, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

let updated = 0
let inserted = 0

console.log('Configurando productos (nombre, precio, categoría, tipo, tamaño)...\n')

for (const row of PRODUCTS) {
  const [idOrNull, name, price, category, type, size] = row
  if (idOrNull) {
    const r = updateStmt.run(name, price, category, type, size || null, now, idOrNull)
    if (r.changes > 0) updated++
    console.log('  ✓', name, '|', price, '|', category, '|', size || '')
  } else {
    const newId = 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
    insertStmt.run(newId, name, price, null, category, type, 999, size || null, now, now)
    inserted++
    console.log('  +', name, '|', price, '|', category, '|', size || '')
  }
}

db.close()
console.log('\nActualizados:', updated, '| Insertados:', inserted)
console.log('Listo.')