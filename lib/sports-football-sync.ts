/**
 * Sincroniza equipos, partidos y competición desde football-data.org → BD local.
 * Ejecutar una vez al desplegar o cuando cambie el calendario: npm run sync:sports-football
 */

import type { FootballMatch, FootballTeamDetail } from '@/lib/football-data'
import {
  fetchAllMatchesFromApi,
  fetchCompetitionFromApi,
  fetchTeamsFromApi,
} from '@/lib/football-api'
import {
  getStoredMatchCount,
  getStoredTeamCount,
  hasFootballDataInDb,
  upsertFootballCatalog,
} from '@/lib/sports-football-db'

export interface SyncFootballResult {
  teams: number
  matches: number
  competition: string
  syncedAt: string
}

export async function syncFootballCatalogFromApi(): Promise<SyncFootballResult> {
  const [competition, teams, matches] = await Promise.all([
    fetchCompetitionFromApi(),
    fetchTeamsFromApi(),
    fetchAllMatchesFromApi(),
  ])

  const syncedAt = new Date().toISOString()

  const { teams: teamCount, matches: matchCount } = await upsertFootballCatalog(
    {
      id: 'WC',
      name: competition.name,
      emblem: competition.emblem,
      startDate: competition.currentSeason.startDate,
      endDate: competition.currentSeason.endDate,
      currentMatchday: competition.currentSeason.currentMatchday,
    },
    teams,
    matches
  )

  return {
    teams: teamCount,
    matches: matchCount,
    competition: competition.name,
    syncedAt,
  }
}

export async function getFootballCatalogStatus(): Promise<{
  inDb: boolean
  teams: number
  matches: number
}> {
  const inDb = await hasFootballDataInDb()
  if (!inDb) return { inDb: false, teams: 0, matches: 0 }
  return {
    inDb: true,
    teams: await getStoredTeamCount(),
    matches: await getStoredMatchCount(),
  }
}

let catalogSyncInflight: Promise<SyncFootballResult> | null = null

/** Sincroniza desde la API si el catálogo está vacío (una vez por proceso). */
export async function ensureFootballCatalogSynced(): Promise<void> {
  if (await hasFootballDataInDb()) return

  if (!process.env.FOOTBALL_DATA_API_TOKEN) {
    throw new Error(
      'Catálogo del Mundial no sincronizado. Configura FOOTBALL_DATA_API_TOKEN y ejecuta: npm run sync:sports-football'
    )
  }

  if (catalogSyncInflight) {
    await catalogSyncInflight
    return
  }

  catalogSyncInflight = syncFootballCatalogFromApi().finally(() => {
    catalogSyncInflight = null
  })

  await catalogSyncInflight
}

export type { FootballMatch, FootballTeamDetail }
