/**
 * Sincroniza equipos, partidos y competición desde football-data.org → BD local.
 * Ejecutar una vez al desplegar o cuando cambie el calendario: npm run sync:sports-football
 */

import { canUseFootballApi } from '@/lib/football-api-budget'
import type { FootballMatch, FootballTeamDetail } from '@/lib/football-data'
import {
  fetchAllMatchesFromApi,
  fetchCompetitionFromApi,
  fetchTeamsFromApi,
} from '@/lib/football-api'
import {
  getStoredCompetition,
  getStoredMatchCount,
  getStoredTeamCount,
  hasFootballDataInDb,
  upsertFootballCatalog,
} from '@/lib/sports-football-db'

const DEFAULT_CATALOG_REFRESH_MS = 15 * 60_000

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

function catalogRefreshIntervalMs(): number {
  const raw = Number(process.env.FOOTBALL_CATALOG_REFRESH_MS ?? DEFAULT_CATALOG_REFRESH_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CATALOG_REFRESH_MS
}

let catalogAutoRefreshInflight: Promise<boolean> | null = null

/** Refresca catálogo desde la API si está desactualizado (respeta cuota diaria). */
export async function maybeRefreshFootballCatalog(): Promise<boolean> {
  if (catalogAutoRefreshInflight) return catalogAutoRefreshInflight

  catalogAutoRefreshInflight = (async () => {
    try {
      const competition = await getStoredCompetition()
      if (!competition) {
        await ensureFootballCatalogSynced()
        return true
      }

      const age = Date.now() - new Date(competition.syncedAt).getTime()
      if (age < catalogRefreshIntervalMs()) return false

      if (!(await canUseFootballApi(3))) return false

      await syncFootballCatalogFromApi()
      return true
    } catch (error) {
      console.warn('[football] Auto-refresh de catálogo falló:', error)
      return false
    } finally {
      catalogAutoRefreshInflight = null
    }
  })()

  return catalogAutoRefreshInflight
}

export type { FootballMatch, FootballTeamDetail }
