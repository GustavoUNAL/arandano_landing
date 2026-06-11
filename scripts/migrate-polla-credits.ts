/**
 * Alinea créditos de bienvenida con el reglamento vigente (20.000).
 * Uso: npx tsx scripts/migrate-polla-credits.ts
 */

import { dbAll, dbGet } from '../lib/db'
import { syncWelcomeCreditsIfNeeded } from '../lib/sports-polla'

async function main() {
  const users = await dbAll<{ id: string }>('SELECT id FROM sports_users')
  let updated = 0

  for (const { id } of users) {
    const before = await dbGet<{ credits: number }>('SELECT credits FROM sports_users WHERE id = ?', [
      id,
    ])
    const creditsBefore = before?.credits ?? 0
    await syncWelcomeCreditsIfNeeded(id)
    const after = await dbGet<{ credits: number }>('SELECT credits FROM sports_users WHERE id = ?', [id])
    const creditsAfter = after?.credits ?? 0
    if (creditsAfter !== creditsBefore) updated++
  }

  console.log(`✅ Migración completada: ${updated} de ${users.length} usuarios actualizados`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
