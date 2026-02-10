/**
 * Actualiza precios de productos en SQLite según la lista indicada.
 * Crea Cerveza Pokeron 750 ml y Cerveza michelada si no existen.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// id o nombre normalizado -> nuevo precio (COP)
const updates = [
  { id: 'cafe-aromatizado', price: 5000 },
  { id: 'cafe-frio', price: 4000 },
  { id: 'cafe-frio-leche', price: 5000 },
  { id: 'cafe-helado', price: 10000 },
  { id: 'cafe-irlandes', price: 10000 },
  { id: 'cafe-leche', price: 5000 },
  { id: 'cafe-negro', price: 4000 },
  { id: 'carajillo', price: 8000 },
  { id: 'vaso-leche', price: 5000 },
  { id: 'bebida-1767478306369-c8s8nr6nh', price: 15000 }, // Moscow Mule
  { id: 'bebida-1767478463497-c2aya0ta0', price: 15000 },  // Cóctel de Campari
  { id: 'bebida-1767479422734-8ofoa07j2', price: 15000 },  // Cóctel de soda sin licor
  { id: 'bebida-1767479537737-5pcmv20sn', price: 7000 },   // Hervido
  { id: 'bebida-1767479680271-wp5qa9j7m', price: 15000 }, // Margaritas
  { id: 'coctel-arandano', price: 15000 },
  { id: 'vino-caliente', price: 10000 },
  { id: 'acompanante', price: 3000 },
  { id: 'pastel-dia', price: 7000 },
  { id: 'sandwich-dia', price: 10000 },
  { id: 'cerveza-aguila-330', price: 3500 },
  { id: 'cerveza-budweiser', price: 3500 },
  { id: 'cerveza-club-colombia-330', price: 4000 },
  { id: 'cerveza-coronita', price: 5000 },
  { id: 'cerveza-heineken', price: 5000 },
  { id: 'cerveza-poker-330', price: 3500 },
  { id: 'cerveza-poker-laton', price: 5500 },
]

const updateStmt = db.prepare('UPDATE products SET price = ?, updatedAt = ? WHERE id = ?')
const now = new Date().toISOString()

console.log('Actualizando precios en SQLite...\n')
let updated = 0
for (const { id, price } of updates) {
  const r = updateStmt.run(price, now, id)
  if (r.changes > 0) {
    const row = db.prepare('SELECT name FROM products WHERE id = ?').get(id)
    console.log('  ✓', row?.name || id, '→ $' + price.toLocaleString('es-CO'))
    updated++
  } else {
    console.log('  — No encontrado:', id)
  }
}

// Cerveza Poker 750 ml (Pokeron) y Cerveza michelada: actualizar si existen, si no crear
const poker750 = db.prepare("SELECT id, name FROM products WHERE name LIKE '%750%' AND name LIKE '%Poker%'").get()
if (poker750) {
  updateStmt.run(7000, now, poker750.id)
  console.log('  ✓', poker750.name, '→ $7.000')
} else {
  const id1 = 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  db.prepare(`
    INSERT INTO products (id, name, price, description, category, type, stock, size, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id1, 'Cerveza Poker 750 ml', 7000, null, 'cerveza', 'bebida', 999, '750 ml', now, now)
  console.log('  + Creado: Cerveza Poker 750 ml → $7.000')
}

const michelada = db.prepare("SELECT id, name FROM products WHERE LOWER(name) LIKE '%michelada%'").get()
if (michelada) {
  updateStmt.run(7000, now, michelada.id)
  console.log('  ✓', michelada.name, '→ $7.000')
} else {
  const id2 = 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  db.prepare(`
    INSERT INTO products (id, name, price, description, category, type, stock, size, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id2, 'Cerveza michelada', 7000, null, 'cerveza', 'bebida', 999, null, now, now)
  console.log('  + Creado: Cerveza michelada → $7.000')
}

db.close()
console.log('\nTotal actualizados:', updated)
console.log('Listo.')