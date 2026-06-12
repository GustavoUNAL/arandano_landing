import { dbAll, dbGet, dbRun, dbTransaction } from '@/lib/db'
import type { FootballMatch, FootballTeamDetail, MatchScore, WorldCupFullData } from '@/lib/football-data'

const PLACEHOLDER_TEAM_ID_BASE = 9_000_000

function stablePlaceholderTeamId(label: string): number {
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return PLACEHOLDER_TEAM_ID_BASE + (h % 999_999)
}

function resolveTeamForCatalog(
  team: FootballMatch['homeTeam'],
  known: Map<number, FootballTeamDetail>
): { id: number; detail: FootballTeamDetail } {
  if (team.id && team.id > 0 && known.has(team.id)) {
    return { id: team.id, detail: known.get(team.id)! }
  }
  if (team.id && team.id > 0) {
    const detail: FootballTeamDetail = {
      id: team.id,
      name: team.name || team.shortName || 'Por definir',
      shortName: team.shortName || team.name || 'Por definir',
      tla: team.tla || 'TBD',
      crest: team.crest || '',
      areaName: '',
      areaFlag: null,
      coach: null,
      founded: null,
      clubColors: null,
      squadSize: 0,
      website: null,
    }
    return { id: team.id, detail }
  }

  const name = team.name || team.shortName || 'Por definir'
  const id = stablePlaceholderTeamId(name)
  const detail: FootballTeamDetail = {
    id,
    name,
    shortName: team.shortName || name.slice(0, 16),
    tla: team.tla || 'TBD',
    crest: team.crest || '',
    areaName: '',
    areaFlag: null,
    coach: null,
    founded: null,
    clubColors: null,
    squadSize: 0,
    website: null,
  }
  return { id, detail }
}

export interface StoredCompetition {
  id: string
  name: string
  emblem: string
  startDate: string
  endDate: string
  currentMatchday: number | null
  syncedAt: string
}

export interface StoredMatchRow {
  id: number
  utcDate: string
  status: string
  matchday: number | null
  stage: string
  matchGroup: string | null
  venue: string | null
  homeTeamId: number
  awayTeamId: number
  scoreJson: string
  syncedAt: string
}

const DEFAULT_SCORE: MatchScore = {
  winner: null,
  duration: null,
  fullTime: { home: null, away: null },
  halfTime: { home: null, away: null },
}

export function parseScoreJson(raw: string | null | undefined): MatchScore {
  if (!raw) return { ...DEFAULT_SCORE, halfTime: { home: null, away: null } }
  try {
    const parsed = JSON.parse(raw) as MatchScore
    return {
      winner: parsed.winner ?? null,
      duration: parsed.duration ?? null,
      fullTime: {
        home: parsed.fullTime?.home ?? null,
        away: parsed.fullTime?.away ?? null,
      },
      halfTime: {
        home: parsed.halfTime?.home ?? null,
        away: parsed.halfTime?.away ?? null,
      },
      regularTime: parsed.regularTime ?? null,
    }
  } catch {
    return { ...DEFAULT_SCORE, halfTime: { home: null, away: null } }
  }
}

export async function hasFootballDataInDb(): Promise<boolean> {
  const row = await dbGet<{ count: number }>(
    'SELECT COUNT(*) as count FROM sports_teams'
  )
  return (row?.count ?? 0) > 0
}

export async function getStoredTeamCount(): Promise<number> {
  const row = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM sports_teams')
  return row?.count ?? 0
}

export async function getStoredMatchCount(): Promise<number> {
  const row = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM sports_matches')
  return row?.count ?? 0
}

export async function getStoredTeams(): Promise<FootballTeamDetail[]> {
  return dbAll<FootballTeamDetail>(
    `SELECT id, name, shortName, tla, crest, areaName, areaFlag, coach, founded, clubColors, squadSize, website
     FROM sports_teams
     ORDER BY name ASC`
  )
}

export async function getStoredCompetition(): Promise<StoredCompetition | null> {
  return (
    (await dbGet<StoredCompetition>(
      `SELECT id, name, emblem, startDate, endDate, currentMatchday, syncedAt FROM sports_competition WHERE id = 'WC'`
    )) ?? null
  )
}

export async function getStoredMatchRows(): Promise<StoredMatchRow[]> {
  return dbAll<StoredMatchRow>(
    `SELECT id, utcDate, status, matchday, stage, matchGroup, venue, homeTeamId, awayTeamId, scoreJson, syncedAt
     FROM sports_matches
     ORDER BY utcDate ASC`
  )
}

export async function getStoredMatchRow(matchId: number): Promise<StoredMatchRow | null> {
  return (
    (await dbGet<StoredMatchRow>(
      `SELECT id, utcDate, status, matchday, stage, matchGroup, venue, homeTeamId, awayTeamId, scoreJson, syncedAt
       FROM sports_matches WHERE id = ?`,
      [matchId]
    )) ?? null
  )
}

function teamFromDetail(t: FootballTeamDetail) {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    tla: t.tla,
    crest: t.crest,
  }
}

export function buildFootballMatchFromStored(
  row: StoredMatchRow,
  teamsById: Map<number, FootballTeamDetail>
): FootballMatch {
  const home = teamsById.get(row.homeTeamId)
  const away = teamsById.get(row.awayTeamId)
  if (!home || !away) {
    throw new Error(`Equipos no encontrados para partido ${row.id}`)
  }

  return {
    id: row.id,
    utcDate: row.utcDate,
    status: row.status,
    matchday: row.matchday,
    stage: row.stage,
    group: row.matchGroup,
    venue: row.venue,
    homeTeam: teamFromDetail(home),
    awayTeam: teamFromDetail(away),
    score: parseScoreJson(row.scoreJson),
  }
}

export async function upsertFootballCatalog(
  competition: Omit<StoredCompetition, 'syncedAt'>,
  teams: FootballTeamDetail[],
  matches: FootballMatch[]
): Promise<{ teams: number; matches: number }> {
  const syncedAt = new Date().toISOString()
  let storedMatches = 0

  await dbTransaction(async (tx) => {
    await tx.run(
      `INSERT INTO sports_competition (id, name, emblem, startDate, endDate, currentMatchday, syncedAt)
       VALUES ('WC', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         emblem = excluded.emblem,
         startDate = excluded.startDate,
         endDate = excluded.endDate,
         currentMatchday = excluded.currentMatchday,
         syncedAt = excluded.syncedAt`,
      [
        competition.name,
        competition.emblem,
        competition.startDate,
        competition.endDate,
        competition.currentMatchday,
        syncedAt,
      ]
    )

    for (const team of teams) {
      await tx.run(
        `INSERT INTO sports_teams (id, name, shortName, tla, crest, areaName, areaFlag, coach, founded, clubColors, squadSize, website, syncedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           shortName = excluded.shortName,
           tla = excluded.tla,
           crest = excluded.crest,
           areaName = excluded.areaName,
           areaFlag = excluded.areaFlag,
           coach = excluded.coach,
           founded = excluded.founded,
           clubColors = excluded.clubColors,
           squadSize = excluded.squadSize,
           website = excluded.website,
           syncedAt = excluded.syncedAt`,
        [
          team.id,
          team.name,
          team.shortName,
          team.tla,
          team.crest,
          team.areaName,
          team.areaFlag,
          team.coach,
          team.founded,
          team.clubColors,
          team.squadSize,
          team.website,
          syncedAt,
        ]
      )
    }

    const teamsById = new Map(teams.map((t) => [t.id, t]))

    for (const match of matches) {
      const home = resolveTeamForCatalog(match.homeTeam, teamsById)
      const away = resolveTeamForCatalog(match.awayTeam, teamsById)

      for (const detail of [home.detail, away.detail]) {
        if (teamsById.has(detail.id)) continue
        await tx.run(
          `INSERT INTO sports_teams (id, name, shortName, tla, crest, areaName, areaFlag, coach, founded, clubColors, squadSize, website, syncedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             shortName = excluded.shortName,
             tla = excluded.tla,
             crest = excluded.crest,
             syncedAt = excluded.syncedAt`,
          [
            detail.id,
            detail.name,
            detail.shortName,
            detail.tla,
            detail.crest,
            detail.areaName,
            detail.areaFlag,
            detail.coach,
            detail.founded,
            detail.clubColors,
            detail.squadSize,
            detail.website,
            syncedAt,
          ]
        )
      }

      await tx.run(
        `INSERT INTO sports_matches (id, utcDate, status, matchday, stage, matchGroup, venue, homeTeamId, awayTeamId, scoreJson, syncedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           utcDate = excluded.utcDate,
           status = excluded.status,
           matchday = excluded.matchday,
           stage = excluded.stage,
           matchGroup = excluded.matchGroup,
           venue = excluded.venue,
           homeTeamId = excluded.homeTeamId,
           awayTeamId = excluded.awayTeamId,
           scoreJson = excluded.scoreJson,
           syncedAt = excluded.syncedAt`,
        [
          match.id,
          match.utcDate,
          match.status,
          match.matchday,
          match.stage,
          match.group,
          match.venue ?? null,
          home.id,
          away.id,
          JSON.stringify(match.score),
          syncedAt,
        ]
      )
      storedMatches++
    }
  })

  return { teams: teams.length, matches: storedMatches }
}

export async function updateStoredMatchLive(
  match: Pick<FootballMatch, 'id' | 'status' | 'score'>
): Promise<void> {
  await dbRun(
    `UPDATE sports_matches SET status = ?, scoreJson = ?, syncedAt = ? WHERE id = ?`,
    [match.status, JSON.stringify(match.score), new Date().toISOString(), match.id]
  )
}

export async function updateStoredMatchesBatch(
  matches: Array<Pick<FootballMatch, 'id' | 'status' | 'score'>>
): Promise<void> {
  if (matches.length === 0) return
  await dbTransaction(async (tx) => {
    const syncedAt = new Date().toISOString()
    for (const match of matches) {
      await tx.run(
        `UPDATE sports_matches SET status = ?, scoreJson = ?, syncedAt = ? WHERE id = ?`,
        [match.status, JSON.stringify(match.score), syncedAt, match.id]
      )
    }
  })
}

/** Stats de catálogo para respuestas API */
export function buildCatalogStats(allMatches: Array<{ status: string }>, teamsCount: number) {
  return {
    totalMatches: allMatches.length,
    totalTeams: teamsCount,
    playedMatches: allMatches.filter((m) => m.status === 'FINISHED').length,
  }
}

export type { WorldCupFullData }
