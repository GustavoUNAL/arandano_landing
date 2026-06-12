/**
 * Backup en caliente de SQLite (app puede seguir corriendo con PM2).
 * Usa la API backup() en modo solo lectura — no requiere wal_checkpoint.
 *
 * Uso: node scripts/export-sqlite-live.js
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const srcPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/arandano.db')
const destPath =
  process.argv[2] || path.join(__dirname, '../backups/sqlite/arandano-export-clean.db')

if (!fs.existsSync(srcPath)) {
  console.error('No existe:', srcPath)
  process.exit(1)
}

fs.mkdirSync(path.dirname(destPath), { recursive: true })
if (fs.existsSync(destPath)) fs.unlinkSync(destPath)

const src = new Database(srcPath, { readonly: true, timeout: 10000 })

let usersSrc = 0
let predsSrc = 0
try {
  usersSrc = src.prepare('SELECT COUNT(*) AS n FROM sports_users').get().n
  predsSrc = src.prepare('SELECT COUNT(*) AS n FROM match_predictions').get().n
} catch (e) {
  console.error('Origen sin tablas sports:', e.message)
  src.close()
  process.exit(1)
}

console.log('Origen:', srcPath)
console.log('Usuarios:', usersSrc, '| Pronósticos:', predsSrc)

const dst = new Database(destPath)
try {
  const backup = src.backup(dst)
  while (!backup.completed) {
    backup.transfer(1000)
  }
  if (backup.failed) {
    throw new Error(backup.message || 'backup failed')
  }
  const users = dst.prepare('SELECT COUNT(*) AS n FROM sports_users').get().n
  const preds = dst.prepare('SELECT COUNT(*) AS n FROM match_predictions').get().n
  if (users !== usersSrc || preds !== predsSrc) {
    throw new Error(`Backup incompleto: origen ${usersSrc}/${predsSrc} → destino ${users}/${preds}`)
  }
  console.log('Export OK:', destPath)
  console.log('Verificado:', users, 'usuarios,', preds, 'pronósticos')
} finally {
  dst.close()
  src.close()
}
