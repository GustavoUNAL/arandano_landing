/**
 * Sincroniza equipos, partidos y competición del Mundial desde football-data.org → BD.
 * Uso: npm run sync:sports-football
 */

import { syncFootballCatalogFromApi, getFootballCatalogStatus } from '../lib/sports-football-sync'

async function main() {
  console.log('⚽ Sincronizando catálogo del Mundial desde football-data.org...\n')

  const before = await getFootballCatalogStatus()
  if (before.inDb) {
    console.log(`Estado actual: ${before.teams} equipos, ${before.matches} partidos en BD`)
  } else {
    console.log('BD vacía — primera sincronización')
  }

  const result = await syncFootballCatalogFromApi()

  console.log(`\n✅ Sincronización completada (${result.syncedAt})`)
  console.log(`   Competición: ${result.competition}`)
  console.log(`   Equipos:     ${result.teams}`)
  console.log(`   Partidos:    ${result.matches}`)
  console.log('\nEl backend leerá equipos y calendario desde la BD.')
  console.log('Solo hará llamadas API en vivo (marcador, goles, estadísticas).')
}

main().catch((err) => {
  console.error('❌ Error en sincronización:', err instanceof Error ? err.message : err)
  process.exit(1)
})
