/**
 * Normaliza categorías del inventario a las 7 definidas:
 * activos, bebidas alcoholicas, cigarrillos, comestibles, insumos para cocteles, cafeteria, productos de aseo.
 * Asigna categoría a todo ítem que no la tenga.
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const CATEGORIES_NEW = [
  'activos',
  'cigarrillos',
  'aseo',
  'comestibles',
  'bebidas alcoholicas',
  'insumos para cocteles',
  'insumos para cafeteria'
]

// Mapeo: categoría actual -> categoría nueva
const MAP = {
  'activos': 'activos',
  'activos / insumos de mantenimiento': 'activos',
  'cigarrillos': 'cigarrillos',
  'productos regulados': 'cigarrillos',
  'aseo': 'aseo',
  'productos de aseo': 'aseo',
  'desechables': 'aseo',
  'productos de limpieza': 'aseo',
  'productos de limpieza / bioseguridad': 'aseo',
  'comestibles': 'comestibles',
  'acompañantes': 'comestibles',
  'cervezas': 'bebidas alcoholicas',
  'licores': 'bebidas alcoholicas',
  'licores para shots': 'bebidas alcoholicas',
  'siropes y bases': 'insumos para cocteles',
  'insumos para cafeteria': 'insumos para cafeteria',
  'cafeteria': 'insumos para cafeteria',
  'insumos para café': 'insumos para cafeteria'
}

const DEFAULT_CATEGORY = 'comestibles'
const now = new Date().toISOString()

const rows = db.prepare('SELECT id, name, category FROM inventory').all()
let updated = 0
const byNew = {}

rows.forEach(row => {
  const current = (row.category || '').trim()
  let newCat = MAP[current]
  if (!newCat) {
    if (current && CATEGORIES_NEW.includes(current)) {
      newCat = current
    } else {
      newCat = DEFAULT_CATEGORY
    }
  }
  if (newCat !== current) {
    db.prepare('UPDATE inventory SET category = ?, updatedAt = ? WHERE id = ?').run(newCat, now, row.id)
    updated++
  }
  byNew[newCat] = (byNew[newCat] || 0) + 1
})

console.log('Categorías normalizadas. Ítems actualizados:', updated)
console.log('\nConteo por categoría final:')
CATEGORIES_NEW.forEach(c => {
  console.log(' ', c, ':', byNew[c] || 0)
})

db.close()
console.log('\nListo.')
