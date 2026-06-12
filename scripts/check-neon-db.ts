/**
 * Verifica conexión a Neon (PostgreSQL) y muestra conteos de la polla.
 * Uso: npm run check:neon
 *
 * Nota: en el SQL Editor de Neon las columnas son minúsculas (updatedat, displayalias…).
 */

import { getDbMode } from '../lib/db-utils'
import { dbAll, dbGet } from '../lib/db'

const NEON_SQL = `
-- Copiar en Neon → SQL Editor (columnas en minúsculas)
SELECT email, displayalias, credits, totalpoints, updatedat
FROM sports_users
ORDER BY updatedat DESC
LIMIT 10;

SELECT COUNT(*) AS usuarios FROM sports_users;
SELECT COUNT(*) AS pronosticos FROM match_predictions;
SELECT COUNT(*) AS equipos FROM sports_teams;
SELECT COUNT(*) AS partidos FROM sports_matches;
`.trim()

function maskDatabaseUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.password) u.password = '****'
    return u.toString()
  } catch {
    return '(URL inválida)'
  }
}

async function main() {
  const mode = getDbMode()
  const dbUrl = process.env.DATABASE_URL?.trim() ?? ''

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Verificación base de datos remota (Neon / PostgreSQL)')
  console.log('═══════════════════════════════════════════════════════════\n')

  if (mode !== 'postgres') {
    console.error(`❌ DB_MODE=${mode} — no estás usando PostgreSQL.`)
    console.error('   En .env.local: DB_MODE=postgres y DATABASE_URL=postgresql://...')
    process.exit(1)
  }

  if (!dbUrl) {
    console.error('❌ DATABASE_URL no configurado.')
    process.exit(1)
  }

  console.log(`Modo:     postgres`)
  console.log(`Conexión: ${maskDatabaseUrl(dbUrl)}\n`)

  const t0 = Date.now()

  const [users, predictions, teams, matches] = await Promise.all([
    dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM sports_users'),
    dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM match_predictions'),
    dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM sports_teams'),
    dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM sports_matches'),
  ])

  const recent = await dbAll<{
    email: string
    displayAlias: string | null
    credits: number
    updatedAt: string
  }>(
    `SELECT email, displayAlias, credits, updatedAt
     FROM sports_users
     ORDER BY updatedAt DESC
     LIMIT 5`
  )

  const ms = Date.now() - t0

  console.log('Registros en Neon:')
  console.log(`  sports_users:        ${users?.c ?? 0}`)
  console.log(`  match_predictions:   ${predictions?.c ?? 0}`)
  console.log(`  sports_teams:        ${teams?.c ?? 0}`)
  console.log(`  sports_matches:      ${matches?.c ?? 0}`)
  console.log(`\nConsulta completada en ${ms} ms\n`)

  if (recent.length) {
    console.log('Últimos usuarios actualizados (app → camelCase):')
    for (const u of recent) {
      console.log(`  · ${u.email} (${u.displayAlias ?? '—'}) — ${u.credits} créditos`)
    }
    console.log('')
  }

  console.log('── SQL para la consola de Neon (columnas minúsculas) ──\n')
  console.log(NEON_SQL)
  console.log('\n✅ Conexión OK — la app lee/escribe en esta base remota.')
}

main().catch((err) => {
  console.error('\n❌ Error al conectar:', err instanceof Error ? err.message : err)
  process.exit(1)
})
