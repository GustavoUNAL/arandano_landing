/**
 * Exporta todas las tablas de data/arandano.db a un JSON único para migrar a otro backend.
 * - sales.items y recipes.ingredients se devuelven como arrays/objetos (ya parseados).
 *
 * Uso: node scripts/export-sqlite-for-migration.js
 * Salida: data/migration-dump.json
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const outPath = path.join(__dirname, '..', 'data', 'migration-dump.json')

const TABLES = [
  'products',
  'inventory',
  'sales',
  'recipes',
  'stock_movements',
  'tasks',
  'expenses'
]

function parseRow (table, row) {
  const o = { ...row }
  if (table === 'sales' && o.items != null && typeof o.items === 'string') {
    try {
      o.items = JSON.parse(o.items)
    } catch {
      o.items = []
    }
  }
  if (table === 'recipes' && o.ingredients != null && typeof o.ingredients === 'string') {
    try {
      o.ingredients = JSON.parse(o.ingredients)
    } catch {
      o.ingredients = []
    }
  }
  return o
}

if (!fs.existsSync(dbPath)) {
  console.error('No existe:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath, { readonly: true })
const dump = {
  exportedAt: new Date().toISOString(),
  sourceFile: 'data/arandano.db',
  tables: {}
}

for (const t of TABLES) {
  try {
    const rows = db.prepare(`SELECT * FROM "${t}"`).all()
    dump.tables[t] = rows.map((r) => parseRow(t, r))
    console.log(`${t}: ${rows.length} filas`)
  } catch (e) {
    dump.tables[t] = []
    dump.tables[`_${t}_error`] = e.message
    console.warn(`${t}: error —`, e.message)
  }
}

db.close()
fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf8')
console.log('\nOK →', outPath)
console.log('Puedes enviar ese archivo al otro proyecto (API, importador o COPY a PostgreSQL).')
