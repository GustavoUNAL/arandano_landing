import { FootballApiQuotaError } from '@/lib/ari/errors'
import type { FootballMatch, FootballTeamDetail } from '@/lib/football-data'

const API_BASE = 'https://api.football-data.org/v4'
export const WC_CODE = 'WC'
export const WC_COMPETITION_ID = 2000
export const WC_SEASON = 2026

export async function footballFetch<T>(
  path: string,
  options?: { live?: boolean; unfoldGoals?: boolean; optional?: boolean }
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
    ...(options?.live ? { cache: 'no-store' } : { next: { revalidate: 3600 } }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 429) {
      throw new FootballApiQuotaError(res.status, detail.slice(0, 300))
    }
    if (options?.optional) {
      console.warn(`[football-data.org] optional ${res.status}:`, path)
      throw new Error(`football-data.org optional: ${res.status}`)
    }
    console.error(`[football-data.org] error ${res.status}:`, path, detail.slice(0, 200))
    throw new Error(`football-data.org error: ${res.status}`)
  }

  return res.json()
}

export async function fetchCompetitionFromApi() {
  return footballFetch<{
    name: string
    emblem: string
    currentSeason: {
      startDate: string
      endDate: string
      currentMatchday: number | null
    }
  }>(`/competitions/${WC_CODE}`)
}

export async function fetchTeamsFromApi(): Promise<FootballTeamDetail[]> {
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

export async function fetchAllMatchesFromApi(): Promise<FootballMatch[]> {
  const matchesRes = await footballFetch<{
    matches: FootballMatch[]
  }>(`/competitions/${WC_CODE}/matches?season=${WC_SEASON}&limit=120`)

  return matchesRes.matches.sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  )
}

/** Solo partidos en juego — 1 llamada API en tiempo real */
export async function fetchLiveMatchesFromApi(): Promise<FootballMatch[]> {
  try {
    const res = await footballFetch<{ matches: FootballMatch[] }>(
      `/matches?competitions=${WC_COMPETITION_ID}&status=IN_PLAY&limit=20`,
      { live: true, optional: true }
    )
    return res.matches
  } catch {
    return []
  }
}

/** Detalle en vivo: marcador, goles y estadísticas */
export async function fetchMatchLiveDetailFromApi(matchId: number): Promise<FootballMatch> {
  return footballFetch<FootballMatch>(`/matches/${matchId}`, {
    live: true,
    unfoldGoals: true,
  })
}

let finishedRefreshCache: { matches: FootballMatch[]; at: number } | null = null
const FINISHED_REFRESH_MS = 30 * 60_000

/** Actualiza resultados recientes para liquidar pronósticos — máx. 1 call / 30 min */
export async function fetchRecentlyFinishedFromApi(force = false): Promise<FootballMatch[]> {
  const now = Date.now()
  if (!force && finishedRefreshCache && now - finishedRefreshCache.at < FINISHED_REFRESH_MS) {
    return finishedRefreshCache.matches
  }

  try {
    const res = await footballFetch<{ matches: FootballMatch[] }>(
      `/competitions/${WC_CODE}/matches?season=${WC_SEASON}&status=FINISHED&limit=30`,
      { live: true, optional: true }
    )
    finishedRefreshCache = { matches: res.matches, at: now }
    return res.matches
  } catch {
    return finishedRefreshCache?.matches ?? []
  }
}

export function needsFinishedRefresh(matches: Array<{ status: string; utcDate: string }>): boolean {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  return matches.some((m) => {
    if (m.status === 'FINISHED') return false
    const started = new Date(m.utcDate).getTime() <= Date.now()
    const recent = new Date(m.utcDate).getTime() >= cutoff
    return started && recent
  })
}
