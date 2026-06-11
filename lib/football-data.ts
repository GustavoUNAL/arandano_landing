import { isMatchFinished, isMatchHappeningNow, isMatchLive } from '@/lib/sports-polla-shared'
import { groupLabel, stageLabel } from '@/lib/world-cup-info'

const API_BASE = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'
const WC_COMPETITION_ID = 2000
const WC_SEASON = 2026

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

async function footballFetch<T>(
  path: string,
  options?: { live?: boolean; unfoldGoals?: boolean }
): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN
  if (!token) {
    throw new Error('FOOTBALL_DATA_API_TOKEN no configurado')
  }

  const headers: Record<string, string> = { 'X-Auth-Token': token }
  if (options?.unfoldGoals) {
    headers['X-Unfold-Goals'] = 'true'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...(options?.live ? { cache: 'no-store' } : { next: { revalidate: 90 } }),
  })

  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`)
  }

  return res.json()
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
  const matchesRes = await footballFetch<{ matches: FootballMatch[] }>(
    `/competitions/${WC_CODE}/matches?season=${WC_SEASON}&status=SCHEDULED&limit=${limit}`
  )
  return matchesRes.matches
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .map(enrichMatch)
}

async function fetchAllScheduledMatches(fresh = false): Promise<EnrichedMatch[]> {
  const matchesRes = await footballFetch<{
    resultSet: { count: number; played: number }
    matches: FootballMatch[]
  }>(`/competitions/${WC_CODE}/matches?season=${WC_SEASON}&limit=120`, { live: fresh })

  return matchesRes.matches
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .map(enrichMatch)
}

async function fetchLiveWorldCupMatches(): Promise<EnrichedMatch[]> {
  const statuses = ['IN_PLAY', 'LIVE', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']
  const batches = await Promise.all(
    statuses.map((status) =>
      footballFetch<{ matches: FootballMatch[] }>(
        `/matches?competitions=${WC_COMPETITION_ID}&status=${status}&limit=20`,
        { live: true }
      ).catch(() => ({ matches: [] as FootballMatch[] }))
    )
  )
  const byId = new Map<number, EnrichedMatch>()
  for (const batch of batches) {
    for (const match of batch.matches) {
      byId.set(match.id, enrichMatch(match))
    }
  }
  return [...byId.values()]
}

function mergeMatchLists(base: EnrichedMatch[], updates: EnrichedMatch[]): EnrichedMatch[] {
  const map = new Map(base.map((m) => [m.id, m]))
  for (const m of updates) {
    const existing = map.get(m.id)
    map.set(m.id, existing ? { ...existing, ...m } : m)
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  )
}

async function fetchTeamsDetail(): Promise<FootballTeamDetail[]> {
  const teamsRes = await footballFetch<{
    teams: Array<{
      id: number
      name: string
      shortName: string
      tla: string
      crest: string
      founded?: number
      clubColors?: string
      website?: string
      area?: { name: string; flag?: string }
      coach?: { name: string } | null
      squad?: unknown[]
    }>
  }>(`/competitions/${WC_CODE}/teams?season=${WC_SEASON}`)

  return teamsRes.teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      tla: t.tla,
      crest: t.crest,
      areaName: t.area?.name ?? '',
      areaFlag: t.area?.flag ?? null,
      coach: t.coach?.name ?? null,
      founded: t.founded ?? null,
      clubColors: t.clubColors ?? null,
      squadSize: t.squad?.length ?? 0,
      website: t.website ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getWorldCupFullData(options?: { fresh?: boolean }): Promise<WorldCupFullData> {
  const fresh = options?.fresh ?? false
  const [competition, scheduledMatches, liveNow, teams] = await Promise.all([
    footballFetch<{
      name: string
      emblem: string
      currentSeason: {
        startDate: string
        endDate: string
        currentMatchday: number | null
      }
    }>(`/competitions/${WC_CODE}`, { live: fresh }),
    fetchAllScheduledMatches(fresh),
    fetchLiveWorldCupMatches(),
    fetchTeamsDetail(),
  ])

  const allMatches = mergeMatchLists(scheduledMatches, liveNow)

  const groupMatches = allMatches.filter((m) => m.stage === 'GROUP_STAGE')
  const knockoutMatches = allMatches.filter((m) => m.stage !== 'GROUP_STAGE')
  const liveMatches = allMatches.filter((m) => m.isLive || isMatchLive(m.status))
  const upcomingMatches = allMatches
    .filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED')
    .slice(0, 8)
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
      startDate: competition.currentSeason.startDate,
      endDate: competition.currentSeason.endDate,
      currentMatchday: competition.currentSeason.currentMatchday,
    },
    stats: {
      totalMatches: allMatches.length,
      totalTeams: teams.length,
      playedMatches: allMatches.filter((m) => m.status === 'FINISHED').length,
    },
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

export async function getMatchById(matchId: number): Promise<MatchDetail> {
  const match = await footballFetch<FootballMatch>(`/matches/${matchId}`, {
    live: true,
    unfoldGoals: true,
  })
  return enrichMatch(match)
}

/** @deprecated Usar getWorldCupFullData */
export async function getWorldCupData(options?: { fresh?: boolean }): Promise<WorldCupData> {
  const full = await getWorldCupFullData(options)
  return full
}
