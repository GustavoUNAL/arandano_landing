/**
 * Exporta una copia consistente de SQLite (integra WAL).
 * Ejecutar en el servidor antes de scp, o vía pull-server-db.sh
 *
 * Uso: node scripts/export-sqlite-clean.js [destino]
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

// Abrir lectura/escritura y consolidar WAL antes del backup
const src = new Database(srcPath)
src.pragma('wal_checkpoint(TRUNCATE)')

const usersBefore = src.prepare('SELECT COUNT(*) AS n FROM sports_users').get().n
const predsBefore = src.prepare('SELECT COUNT(*) AS n FROM match_predictions').get().n

const dst = new Database(destPath)

try {
  src.backup(dst)
  const users = dst.prepare('SELECT COUNT(*) AS n FROM sports_users').get().n
  const preds = dst.prepare('SELECT COUNT(*) AS n FROM match_predictions').get().n
  if (users !== usersBefore || preds !== predsBefore) {
    throw new Error(`Backup incompleto: origen ${usersBefore}/${predsBefore}, destino ${users}/${preds}`)
  }
  console.log(JSON.stringify({ dest: destPath, users, predictions: preds }))
} finally {
  dst.close()
  src.close()
}
