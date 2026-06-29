import {
  fetchLiveMatchesFromApi,
  fetchMatchLiveDetailFromApi,
  fetchRecentlyFinishedFromApi,
  needsFinishedRefresh,
} from '@/lib/football-api'
import { ensureFootballCatalogSynced, maybeRefreshFootballCatalog } from '@/lib/sports-football-sync'
import {
  buildCatalogStats,
  buildFootballMatchFromStored,
  getStoredCompetition,
  getStoredMatchRows,
  getStoredMatchRow,
  getStoredTeams,
  hasFootballDataInDb,
  updateStoredMatchesBatch,
} from '@/lib/sports-football-db'
import { isMatchFinished, isMatchHappeningNow, isMatchLive } from '@/lib/sports-polla-shared'
import { sortUpcomingMatches } from '@/lib/polla-phase'
import { groupLabel, stageLabel } from '@/lib/world-cup-info'

export const WC_CODE = 'WC'
export const WC_COMPETITION_ID = 2000
export const WC_SEASON = 2026

export const LIVE_MATCH_STATUSES = new Set([
  'IN_PLAY',
  'LIVE',
  'PAUSED',
  'EXTRA_TIME',
  'PENALTY_SHOOTOUT',
])

export interface FootballTeam {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

export interface TeamMatchStatistics {
  ball_possession?: number | null
  shots?: number | null
  shots_on_goal?: number | null
  shots_off_goal?: number | null
  corners?: number | null
  fouls?: number | null
  yellow_cards?: number | null
  red_cards?: number | null
  offsides?: number | null
}

export interface MatchTeam extends FootballTeam {
  statistics?: TeamMatchStatistics | null
}

export interface MatchGoal {
  minute: number
  injuryTime: number | null
  type: string
  team: { id: number; name: string }
  scorer: { id: number; name: string } | null
  assist: { id: number; name: string } | null
  score: { home: number; away: number }
}

export interface MatchScore {
  winner: string | null
  duration: string | null
  fullTime: { home: number | null; away: number | null }
  halfTime: { home: number | null; away: number | null }
  regularTime?: { home: number | null; away: number | null } | null
}

export interface FootballTeamDetail extends FootballTeam {
  areaName: string
  areaFlag: string | null
  coach: string | null
  founded: number | null
  clubColors: string | null
  squadSize: number
  website: string | null
}

export interface FootballMatch {
  id: number
  utcDate: string
  status: string
  matchday: number | null
  stage: string
  group: string | null
  minute?: number | null
  injuryTime?: number | null
  venue?: string | null
  lastUpdated?: string | null
  homeTeam: MatchTeam
  awayTeam: MatchTeam
  score: MatchScore
  goals?: MatchGoal[]
}

export type EnrichedMatch = FootballMatch & {
  startsIn: string
  formattedDate: string
  stageLabel: string
  groupLabel: string | null
  statusLabel: string
  isLive: boolean
  isFinished: boolean
  displayScore: { home: number | null; away: number | null }
}

export type MatchDetail = EnrichedMatch

export interface WorldCupGroup {
  id: string
  label: string
  teams: FootballTeam[]
  matches: EnrichedMatch[]
}

export interface KnockoutRound {
  stage: string
  label: string
  matches: EnrichedMatch[]
}

export interface WorldCupData {
  competition: {
    name: string
    emblem: string
    startDate: string
    endDate: string
    currentMatchday: number | null
  }
  stats: {
    totalMatches: number
    totalTeams: number
    playedMatches: number
  }
  upcomingMatches: EnrichedMatch[]
  liveMatches: EnrichedMatch[]
  recentMatches: EnrichedMatch[]
  colombiaQualified: boolean
  colombiaNextMatch: EnrichedMatch | null
}

export interface WorldCupFullData extends WorldCupData {
  teams: FootballTeamDetail[]
  groups: WorldCupGroup[]
  knockoutRounds: KnockoutRound[]
  allMatches: EnrichedMatch[]
  matchesByStage: Record<string, EnrichedMatch[]>
}


/** Caché en memoria — datos estáticos vienen de BD; API solo en vivo */
let wcFullCache: { data: WorldCupFullData; at: number } | null = null
const matchDetailCache = new Map<number, { data: MatchDetail; at: number }>()

const WC_FULL_CACHE_MS = 90_000
const MATCH_DETAIL_CACHE_MS = 30_000
const MATCH_DETAIL_STALE_MS = 5 * 60_000

let wcFullInflight: Promise<WorldCupFullData> | null = null
const matchDetailInflight = new Map<number, Promise<MatchDetail>>()

export function invalidateWorldCupCache(): void {
  wcFullCache = null
}

export function matchStatusLabel(status: string, minute?: number | null, injuryTime?: number | null): string {
  switch (status) {
    case 'IN_PLAY':
    case 'LIVE':
    case 'EXTRA_TIME':
      if (minute != null) {
        const extra = injuryTime ? `+${injuryTime}` : ''
        return `${minute}'${extra}`
      }
      return 'En vivo'
    case 'PAUSED':
      return 'Entretiempo'
    case 'PENALTY_SHOOTOUT':
      return 'Penales'
    case 'FINISHED':
      return 'Finalizado'
    case 'AWARDED':
      return 'Adjudicado'
    case 'SUSPENDED':
      return 'Suspendido'
    case 'POSTPONED':
      return 'Aplazado'
    case 'CANCELLED':
      return 'Cancelado'
    case 'TIMED':
      return 'Programado'
    case 'SCHEDULED':
      return 'Por jugar'
    default:
      return status
  }
}

export function getMatchDisplayScore(match: Pick<FootballMatch, 'status' | 'score'>): {
  home: number | null
  away: number | null
} {
  const { score } = match
  if (score.fullTime.home != null && score.fullTime.away != null) {
    return { home: score.fullTime.home, away: score.fullTime.away }
  }
  if (score.halfTime?.home != null && score.halfTime?.away != null) {
    return { home: score.halfTime.home, away: score.halfTime.away }
  }
  return { home: null, away: null }
}

function formatMatchDate(utcDate: string): string {
  return new Date(utcDate).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStartsIn(utcDate: string): string {
  const diff = new Date(utcDate).getTime() - Date.now()
  if (diff <= 0) return 'Pronto'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `En ${days} día${days > 1 ? 's' : ''}`
  if (hours > 0) return `En ${hours} hora${hours > 1 ? 's' : ''}`
  return 'Hoy'
}

function enrichMatch(match: FootballMatch): EnrichedMatch {
  const live = isMatchLive(match.status) || isMatchHappeningNow(match.status, match.utcDate)
  const finished = isMatchFinished(match.status)
  const statusLabel =
    live && match.status === 'TIMED'
      ? 'En juego'
      : matchStatusLabel(match.status, match.minute, match.injuryTime)
  return {
    ...match,
    startsIn: live ? 'En vivo' : finished ? 'Finalizado' : getStartsIn(match.utcDate),
    formattedDate: formatMatchDate(match.utcDate),
    stageLabel: stageLabel(match.stage),
    groupLabel: match.group ? groupLabel(match.group) : null,
    statusLabel,
    isLive: live,
    isFinished: finished,
    displayScore: getMatchDisplayScore(match),
  }
}

function buildGroups(matches: EnrichedMatch[]): WorldCupGroup[] {
  const groupIds = [...new Set(matches.map((m) => m.group).filter(Boolean))] as string[]
  groupIds.sort()

  return groupIds.map((groupId) => {
    const groupMatches = matches.filter((m) => m.group === groupId)
    const teamMap = new Map<number, FootballTeam>()
    for (const m of groupMatches) {
      teamMap.set(m.homeTeam.id, m.homeTeam)
      teamMap.set(m.awayTeam.id, m.awayTeam)
    }
    return {
      id: groupId,
      label: groupLabel(groupId),
      teams: [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      matches: groupMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()),
    }
  })
}

function buildKnockoutRounds(matches: EnrichedMatch[]): KnockoutRound[] {
  const order = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']
  return order
    .map((stage) => {
      const roundMatches = matches
        .filter((m) => m.stage === stage)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      if (roundMatches.length === 0) return null
      return { stage, label: stageLabel(stage), matches: roundMatches }
    })
    .filter((r): r is KnockoutRound => r !== null)
}

export async function getWorldCupMatches(limit = 30): Promise<EnrichedMatch[]> {
  const full = await getWorldCupFullData()
  return full.allMatches
    .filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED')
    .slice(0, limit)
}

function mergeFootballMatches(base: FootballMatch[], updates: FootballMatch[]): FootballMatch[] {
  const map = new Map(base.map((m) => [m.id, m]))
  for (const m of updates) {
    const existing = map.get(m.id)
    map.set(m.id, existing ? { ...existing, ...m } : m)
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  )
}

function matchNeedsLiveApi(match: Pick<FootballMatch, 'status' | 'utcDate'>): boolean {
  return isMatchLive(match.status) || isMatchHappeningNow(match.status, match.utcDate)
}

async function overlayLiveData(baseMatches: FootballMatch[]): Promise<FootballMatch[]> {
  const needsLive = baseMatches.some((m) => matchNeedsLiveApi(m))
  if (!needsLive) return baseMatches

  const liveFromApi = await fetchLiveMatchesFromApi()
  if (liveFromApi.length === 0) return baseMatches

  const merged = mergeFootballMatches(baseMatches, liveFromApi)
  void updateStoredMatchesBatch(
    liveFromApi.map((m) => ({ id: m.id, status: m.status, score: m.score }))
  )
  return merged
}

async function overlayFinishedResults(baseMatches: FootballMatch[]): Promise<FootballMatch[]> {
  if (!needsFinishedRefresh(baseMatches)) return baseMatches

  const finished = await fetchRecentlyFinishedFromApi()
  if (finished.length === 0) return baseMatches

  const merged = mergeFootballMatches(baseMatches, finished)
  void updateStoredMatchesBatch(
    finished.map((m) => ({ id: m.id, status: m.status, score: m.score }))
  )
  return merged
}

async function buildWorldCupFullDataFromDb(options?: { skipApiOverlays?: boolean }): Promise<WorldCupFullData> {
  await ensureFootballCatalogSynced()
  void maybeRefreshFootballCatalog().then((refreshed) => {
    if (refreshed) invalidateWorldCupCache()
  })

  const inDb = await hasFootballDataInDb()
  if (!inDb) {
    throw new Error(
      'No se pudo cargar el catálogo del Mundial. Revisa FOOTBALL_DATA_API_TOKEN y ejecuta: npm run sync:sports-football'
    )
  }

  const [competition, teams, matchRows] = await Promise.all([
    getStoredCompetition(),
    getStoredTeams(),
    getStoredMatchRows(),
  ])

  if (!competition) {
    throw new Error(
      'Competición no encontrada en BD. Ejecuta: npm run sync:sports-football'
    )
  }

  const teamsById = new Map(teams.map((t) => [t.id, t]))
  let rawMatches = matchRows.map((row) => buildFootballMatchFromStored(row, teamsById))
  if (!options?.skipApiOverlays) {
    rawMatches = await overlayLiveData(rawMatches)
    rawMatches = await overlayFinishedResults(rawMatches)
  }

  const allMatches = rawMatches.map(enrichMatch)

  const groupMatches = allMatches.filter((m) => m.stage === 'GROUP_STAGE')
  const knockoutMatches = allMatches.filter((m) => m.stage !== 'GROUP_STAGE')
  const liveMatches = allMatches.filter((m) => m.isLive || isMatchLive(m.status))
  const upcomingMatches = sortUpcomingMatches(allMatches).slice(0, 16)
  const recentMatches = allMatches
    .filter((m) => m.isFinished)
    .slice(-12)
    .reverse()

  const colombiaQualified = teams.some((t) => t.name === 'Colombia')
  const colombiaNextMatch =
    allMatches.find((m) => m.homeTeam.name === 'Colombia' || m.awayTeam.name === 'Colombia') ?? null

  const matchesByStage: Record<string, EnrichedMatch[]> = {}
  for (const m of allMatches) {
    if (!matchesByStage[m.stage]) matchesByStage[m.stage] = []
    matchesByStage[m.stage].push(m)
  }

  const base: WorldCupData = {
    competition: {
      name: competition.name,
      emblem: competition.emblem,
      startDate: competition.startDate,
      endDate: competition.endDate,
      currentMatchday: competition.currentMatchday,
    },
    stats: buildCatalogStats(allMatches, teams.length),
    upcomingMatches,
    liveMatches,
    recentMatches,
    colombiaQualified,
    colombiaNextMatch,
  }

  return {
    ...base,
    teams,
    groups: buildGroups(groupMatches),
    knockoutRounds: buildKnockoutRounds(knockoutMatches),
    allMatches,
    matchesByStage,
  }
}

export async function getWorldCupFullData(options?: {
  fresh?: boolean
  /** Carga rápida: solo BD, sin llamadas a football-data.org */
  quick?: boolean
}): Promise<WorldCupFullData> {
  const now = Date.now()

  if (!options?.fresh && wcFullCache && now - wcFullCache.at < WC_FULL_CACHE_MS) {
    return wcFullCache.data
  }

  if (wcFullInflight) return wcFullInflight

  wcFullInflight = (async () => {
    try {
      const data = await buildWorldCupFullDataFromDb({
        skipApiOverlays: options?.quick === true,
      })
      wcFullCache = { data, at: Date.now() }
      return data
    } catch (error) {
      if (wcFullCache) return wcFullCache.data
      throw error
    } finally {
      wcFullInflight = null
    }
  })()

  return wcFullInflight
}

async function buildMatchDetailFromDb(matchId: number): Promise<MatchDetail> {
  const [row, teams] = await Promise.all([getStoredMatchRow(matchId), getStoredTeams()])
  if (!row) {
    throw new Error(`Partido ${matchId} no encontrado. Ejecuta: npm run sync:sports-football`)
  }
  const teamsById = new Map(teams.map((t) => [t.id, t]))
  return enrichMatch(buildFootballMatchFromStored(row, teamsById))
}

export async function getMatchById(matchId: number, forceFresh = false): Promise<MatchDetail> {
  const now = Date.now()
  const cached = matchDetailCache.get(matchId)
  if (!forceFresh && cached && now - cached.at < MATCH_DETAIL_CACHE_MS) {
    return cached.data
  }

  const inflight = matchDetailInflight.get(matchId)
  if (inflight) return inflight

  const request = (async () => {
    try {
      const base = await buildMatchDetailFromDb(matchId)
      const needsLive = matchNeedsLiveApi(base)

      if (!needsLive) {
        matchDetailCache.set(matchId, { data: base, at: Date.now() })
        return base
      }

      const live = await fetchMatchLiveDetailFromApi(matchId)
      const enriched = enrichMatch({ ...base, ...live })
      matchDetailCache.set(matchId, { data: enriched, at: Date.now() })
      void updateStoredMatchesBatch([{ id: live.id, status: live.status, score: live.score }])
      return enriched
    } catch (error) {
      if (cached && now - cached.at < MATCH_DETAIL_STALE_MS) return cached.data
      const stale = matchDetailCache.get(matchId)
      if (stale && now - stale.at < MATCH_DETAIL_STALE_MS) return stale.data
      try {
        const fallback = await buildMatchDetailFromDb(matchId)
        matchDetailCache.set(matchId, { data: fallback, at: Date.now() })
        return fallback
      } catch {
        throw error
      }
    } finally {
      matchDetailInflight.delete(matchId)
    }
  })()

  matchDetailInflight.set(matchId, request)
  return request
}

/** @deprecated Usar getWorldCupFullData */
export async function getWorldCupData(options?: { fresh?: boolean }): Promise<WorldCupData> {
  const full = await getWorldCupFullData(options)
  return full
}
