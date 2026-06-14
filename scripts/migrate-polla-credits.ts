/**
 * Recalcula créditos como si todos hubieran empezado con 7.200 (fase de grupos).
 * Fórmula: max(0, 7.200 − créditos apostados en pronósticos).
 * Uso: npx tsx scripts/migrate-polla-credits.ts
 */

import { INITIAL_CREDITS } from '../lib/polla-rules'
import { dbAll, dbGet } from '../lib/db'
import { syncCreditsOnLogin } from '../lib/sports-polla'

async function main() {
  const users = await dbAll<{ id: string; email: string; displayAlias: string | null }>(
    'SELECT id, email, displayAlias FROM sports_users ORDER BY createdAt'
  )
  let updated = 0

  console.log(`Recalculando créditos (${INITIAL_CREDITS} iniciales − apostado por pick)…\n`)

  for (const { id, email, displayAlias } of users) {
    const before = await dbGet<{ credits: number }>('SELECT credits FROM sports_users WHERE id = ?', [id])
    const wagered = await dbGet<{ wagered: number; picks: number }>(
      `SELECT COALESCE(SUM(creditsWagered), 0) AS wagered, COUNT(*) AS picks
       FROM match_predictions WHERE userId = ?`,
      [id]
    )
    const creditsBefore = before?.credits ?? 0
    await syncCreditsOnLogin(id)
    const after = await dbGet<{ credits: number }>('SELECT credits FROM sports_users WHERE id = ?', [id])
    const creditsAfter = after?.credits ?? 0
    const picks = Number(wagered?.picks ?? 0)
    const spent = Number(wagered?.wagered ?? 0)

    if (creditsAfter !== creditsBefore) updated++

    const label = displayAlias ?? email
    console.log(
      `  ${label}: ${creditsBefore} → ${creditsAfter} (${picks} picks, ${spent} apostados)`
    )
  }

  console.log(`\n✅ Migración completada: ${updated} de ${users.length} usuarios actualizados`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
