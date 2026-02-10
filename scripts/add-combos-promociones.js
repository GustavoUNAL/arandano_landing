/**
 * Agrega combos y promociones por día/horario como productos (categoría combo)
 * para que aparezcan en la venta (mesero, carta, carrito).
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

const combos = [
  { name: 'Lunes mañana: Café negro + Snack salado', price: 5000, schedule: 'Lunes - Mañana' },
  { name: 'Lunes tarde: Café frío + pastel del día', price: 10000, schedule: 'Lunes - Tarde' },
  { name: 'Martes mañana: Café negro promo', price: 3000, schedule: 'Martes - Mañana' },
  { name: 'Martes tarde: Café aromatizado + snack sal o dulce', price: 6000, schedule: 'Martes - Tarde' },
  { name: 'Miércoles mañana: Café + snack sal o dulce', price: 6000, schedule: 'Miércoles - Mañana' },
  { name: 'Miércoles tarde: Sándwich + café', price: 12000, schedule: 'Miércoles - Tarde' },
  { name: 'Jueves noche: Affogato especial', price: 9500, schedule: 'Jueves - Noche' },
  { name: 'Jueves todo el día: Cócteles 2x1', price: 15000, schedule: 'Jueves - Todo el día' },
  { name: 'Jueves hasta 7pm: 3 Cerveza michelada', price: 15000, schedule: 'Jueves - Hasta 7pm' },
  { name: 'Jueves noche: Vino caliente especial', price: 9000, schedule: 'Jueves - Noche' },
  { name: 'Viernes noche: Cóctel + salatines', price: 17000, schedule: 'Viernes - Noche' },
  { name: 'Viernes hasta 7pm: 3 Cerveza michelada', price: 15000, schedule: 'Viernes - Hasta 7pm' },
  { name: 'Viernes noche: Cerveza + salatines', price: 6000, schedule: 'Viernes - Noche' },
  { name: 'Sábado noche: 2 cócteles', price: 28000, schedule: 'Sábado - Noche' },
  { name: 'Sábado noche: 3 cervezas', price: 16000, schedule: 'Sábado - Noche' },
]

const insert = db.prepare(`
  INSERT INTO products (
    id, name, price, description, category, type, stock, imageUrl, size,
    minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

console.log('Agregando combos y promociones...\n')
combos.forEach((c, i) => {
  const id = `combo-promo-${Date.now()}-${String(i).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6)}`
  insert.run(
    id,
    c.name,
    c.price,
    c.schedule,
    'combo',
    'cafeteria',
    999,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    0,
    now,
    now
  )
  console.log('  +', c.name, '— $' + c.price.toLocaleString('es-CO'), '|', c.schedule)
})

db.close()
console.log('\nTotal:', combos.length, 'combos/promociones agregados.')
console.log('Listo.')