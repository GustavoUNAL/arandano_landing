/**
 * Servicio de estadísticas api-football.com con cache en BD.
 * Mapea los IDs de football-data.org → af_fixture_id y sirve stats enriquecidas.
 */
import { dbAll, dbGet, dbRun } from '@/lib/db'
import {
  afFetchAllFixtures,
  afFetchMatchEvents,
  afFetchMatchStats,
  afFetchLineups,
  afFetchPlayerStats,
  afFetchTopScorers,
  afFetchTopAssists,
  afFetchTopYellowCards,
  type AfEvent,
  type AfTeamLineup,
  type AfTeamPlayers,
  type AfTeamStats,
  type AfTopScorer,
} from '@/lib/api-football-client'

// Keep types re-exported for server consumers
export type { AfEvent, AfTeamLineup, AfTeamPlayers, AfTeamStats, AfTopScorer }

const MATCH_CACHE_TTL_LIVE = 60_000
const MATCH_CACHE_TTL_FINISHED = 3_600_000
const TOURNAMENT_CACHE_TTL = 3_600_000

export interface AfMatchDetail {
  afFixtureId: number
  stats: AfTeamStats[]
  events: AfEvent[]
  lineups: AfTeamLineup[]
  players: AfTeamPlayers[]
  updatedAt: string
}

export interface TournamentStats {
  topScorers: AfTopScorer[]
  topAssists: AfTopScorer[]
  topYellowCards: AfTopScorer[]
  updatedAt: string
}

// ─── ID mapping ────────────────────────────────────────────────────────────────

export async function syncAfFixtureIds(): Promise<void> {
  if (!process.env.API_FOOTBALL_KEY) return

  const existing = await dbGet<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM sports_matches WHERE af_fixture_id IS NOT NULL'
  )
  if (Number(existing?.cnt) > 5) return

  const fixtures = await afFetchAllFixtures()

  for (const fix of fixtures) {
    const date = fix.fixture.date.slice(0, 10)
    const homeName = fix.teams.home.name
    const awayName = fix.teams.away.name
    const homeWord = homeName.split(' ')[0]
    const awayWord = awayName.split(' ')[0]

    await dbRun(
      `UPDATE sports_matches
       SET af_fixture_id = ?
       WHERE af_fixture_id IS NULL
         AND DATE(utcdate) = ?
         AND (hometeamname = ? OR hometeamname LIKE ?)
         AND (awayteamname = ? OR awayteamname LIKE ?)`,
      [fix.fixture.id, date, homeName, `%${homeWord}%`, awayName, `%${awayWord}%`]
    )
  }
}

export async function getAfFixtureId(fdMatchId: number): Promise<number | null> {
  const row = await dbGet<{ af_fixture_id: number | null }>(
    'SELECT af_fixture_id FROM sports_matches WHERE id = ?',
    [fdMatchId]
  )
  return row?.af_fixture_id ?? null
}

export async function setAfFixtureId(fdMatchId: number, afFixtureId: number): Promise<void> {
  await dbRun(
    'UPDATE sports_matches SET af_fixture_id = ? WHERE id = ?',
    [afFixtureId, fdMatchId]
  )
}

// ─── Match detail cache ────────────────────────────────────────────────────────

interface AfCacheRow {
  af_fixture_id: number
  stats: string
  events: string
  lineups: string
  players: string
  updated_at: string
}

function isCacheStale(updatedAt: string, isLive: boolean): boolean {
  const age = Date.now() - new Date(updatedAt).getTime()
  return age > (isLive ? MATCH_CACHE_TTL_LIVE : MATCH_CACHE_TTL_FINISHED)
}

export async function getAfMatchDetail(
  fdMatchId: number,
  options?: { isLive?: boolean; force?: boolean }
): Promise<AfMatchDetail | null> {
  if (!process.env.API_FOOTBALL_KEY) return null

  let afId = await getAfFixtureId(fdMatchId)
  if (!afId) {
    await syncAfFixtureIds()
    afId = await getAfFixtureId(fdMatchId)
    if (!afId) return null
  }

  const row = await dbGet<AfCacheRow>(
    'SELECT * FROM af_match_cache WHERE af_fixture_id = ?',
    [afId]
  )

  const isLive = options?.isLive ?? false
  const forceRefresh = options?.force ?? false

  const parseField = <T>(raw: string | null | undefined): T[] => {
    if (!raw) return []
    try { return JSON.parse(raw) as T[] } catch { return [] }
  }

  if (row && !forceRefresh && !isCacheStale(row.updated_at, isLive)) {
    return {
      afFixtureId: afId,
      stats: parseField<AfTeamStats>(row.stats),
      events: parseField<AfEvent>(row.events),
      lineups: parseField<AfTeamLineup>(row.lineups),
      players: parseField<AfTeamPlayers>(row.players),
      updatedAt: row.updated_at,
    }
  }

  const [stats, events, lineups, players] = await Promise.allSettled([
    afFetchMatchStats(afId),
    afFetchMatchEvents(afId),
    afFetchLineups(afId),
    afFetchPlayerStats(afId),
  ])

  const result = {
    stats: stats.status === 'fulfilled' ? stats.value : parseField<AfTeamStats>(row?.stats),
    events: events.status === 'fulfilled' ? events.value : parseField<AfEvent>(row?.events),
    lineups: lineups.status === 'fulfilled' ? lineups.value : parseField<AfTeamLineup>(row?.lineups),
    players: players.status === 'fulfilled' ? players.value : parseField<AfTeamPlayers>(row?.players),
  }

  await dbRun(
    `INSERT INTO af_match_cache (af_fixture_id, stats, events, lineups, players, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(af_fixture_id) DO UPDATE SET
       stats = excluded.stats,
       events = excluded.events,
       lineups = excluded.lineups,
       players = excluded.players,
       updated_at = excluded.updated_at`,
    [
      afId,
      JSON.stringify(result.stats),
      JSON.stringify(result.events),
      JSON.stringify(result.lineups),
      JSON.stringify(result.players),
    ]
  )

  return {
    afFixtureId: afId,
    ...result,
    updatedAt: new Date().toISOString(),
  }
}

// ─── Tournament stats cache ────────────────────────────────────────────────────

interface TournamentCacheRow {
  cache_key: string
  data: string
  updated_at: string
}

export async function getTournamentStats(): Promise<TournamentStats | null> {
  if (!process.env.API_FOOTBALL_KEY) return null

  const row = await dbGet<TournamentCacheRow>(
    'SELECT data, updated_at FROM af_tournament_cache WHERE cache_key = ?',
    ['tournament_stats']
  )

  if (row) {
    const age = Date.now() - new Date(row.updated_at).getTime()
    if (age < TOURNAMENT_CACHE_TTL) {
      try {
        const data = JSON.parse(row.data)
        return { ...data, updatedAt: row.updated_at }
      } catch { /* fall through */ }
    }
  }

  const [scorers, assists, yellows] = await Promise.allSettled([
    afFetchTopScorers(),
    afFetchTopAssists(),
    afFetchTopYellowCards(),
  ])

  const data = {
    topScorers: scorers.status === 'fulfilled' ? scorers.value : [],
    topAssists: assists.status === 'fulfilled' ? assists.value : [],
    topYellowCards: yellows.status === 'fulfilled' ? yellows.value : [],
  }

  await dbRun(
    `INSERT INTO af_tournament_cache (cache_key, data, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(cache_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    ['tournament_stats', JSON.stringify(data)]
  )

  return { ...data, updatedAt: new Date().toISOString() }
}

// parseAfStat lives in api-football-client.ts (client-safe)
