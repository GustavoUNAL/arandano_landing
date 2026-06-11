import { groupLabel, stageLabel } from '@/lib/world-cup-info'

const API_BASE = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'
const WC_SEASON = 2026

export interface FootballTeam {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
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
  homeTeam: FootballTeam
  awayTeam: FootballTeam
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

export type EnrichedMatch = FootballMatch & {
  startsIn: string
  formattedDate: string
  stageLabel: string
  groupLabel: string | null
}

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

async function footballFetch<T>(path: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN
  if (!token) {
    throw new Error('FOOTBALL_DATA_API_TOKEN no configurado')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'X-Auth-Token': token },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`)
  }

  return res.json()
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
  return {
    ...match,
    startsIn: getStartsIn(match.utcDate),
    formattedDate: formatMatchDate(match.utcDate),
    stageLabel: stageLabel(match.stage),
    groupLabel: match.group ? groupLabel(match.group) : null,
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

async function fetchAllScheduledMatches(): Promise<EnrichedMatch[]> {
  const matchesRes = await footballFetch<{
    resultSet: { count: number; played: number }
    matches: FootballMatch[]
  }>(`/competitions/${WC_CODE}/matches?season=${WC_SEASON}&limit=120`)

  return matchesRes.matches
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .map(enrichMatch)
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

export async function getWorldCupFullData(): Promise<WorldCupFullData> {
  const [competition, allMatches, teams] = await Promise.all([
    footballFetch<{
      name: string
      emblem: string
      currentSeason: {
        startDate: string
        endDate: string
        currentMatchday: number | null
      }
    }>(`/competitions/${WC_CODE}`),
    fetchAllScheduledMatches(),
    fetchTeamsDetail(),
  ])

  const groupMatches = allMatches.filter((m) => m.stage === 'GROUP_STAGE')
  const knockoutMatches = allMatches.filter((m) => m.stage !== 'GROUP_STAGE')
  const upcomingMatches = allMatches.filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 8)

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

/** @deprecated Usar getWorldCupFullData */
export async function getWorldCupData(): Promise<WorldCupData> {
  const full = await getWorldCupFullData()
  return full
}
