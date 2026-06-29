/**
 * Cliente para api-football.com v3 (api-sports.io)
 * Documentación: https://www.api-football.com/documentation-v3
 */

export const AF_BASE = 'https://v3.football.api-sports.io'
export const AF_WC_LEAGUE = 1      // World Cup
export const AF_WC_SEASON = 2026

function afHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error('API_FOOTBALL_KEY no configurado')
  return { 'x-apisports-key': key }
}

export class AfQuotaError extends Error {
  constructor() { super('api-football.com cuota agotada') }
}

export async function afFetch<T>(path: string, options?: { live?: boolean }): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error('API_FOOTBALL_KEY no configurado')

  const res = await fetch(`${AF_BASE}${path}`, {
    headers: afHeaders(),
    ...(options?.live
      ? { cache: 'no-store' }
      : { next: { revalidate: 300 } }),
  })

  if (res.status === 429) throw new AfQuotaError()
  if (!res.ok) throw new Error(`api-football ${res.status}: ${path}`)

  const json = await res.json() as { response: T; errors?: Record<string, string> }

  if (json.errors && Object.keys(json.errors).length > 0) {
    const msg = Object.values(json.errors)[0]
    throw new Error(`api-football error: ${msg}`)
  }

  return json.response
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AfTeamInfo {
  id: number
  name: string
  logo: string
}

export interface AfFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue?: { name: string | null; city: string | null }
  }
  league: { id: number; name: string; round: string }
  teams: {
    home: AfTeamInfo & { winner: boolean | null }
    away: AfTeamInfo & { winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    extratime: { home: number | null; away: number | null }
    penalty: { home: number | null; away: number | null }
  }
}

export interface AfStatEntry {
  type: string
  value: string | number | null
}

export interface AfTeamStats {
  team: AfTeamInfo
  statistics: AfStatEntry[]
}

export interface AfEvent {
  time: { elapsed: number; extra: number | null }
  team: AfTeamInfo
  player: { id: number; name: string }
  assist: { id: number | null; name: string | null }
  type: 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string
  comments: string | null
}

export interface AfPlayer {
  id: number
  name: string
  photo: string
}

export interface AfPlayerGames {
  minutes: number | null
  number: number | null
  position: string | null
  rating: string | null
  captain: boolean
  substitute: boolean
}

export interface AfPlayerStats {
  games: AfPlayerGames
  shots: { total: number | null; on: number | null }
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null }
  passes: { total: number | null; key: number | null; accuracy: string | null }
  tackles: { total: number | null; blocks: number | null; interceptions: number | null }
  duels: { total: number | null; won: number | null }
  dribbles: { attempts: number | null; success: number | null }
  fouls: { drawn: number | null; committed: number | null }
  cards: { yellow: number; red: number }
  penalty: { won: number | null; scored: number; missed: number; saved: number | null }
}

export interface AfPlayerEntry {
  player: AfPlayer
  statistics: AfPlayerStats[]
}

export interface AfTeamPlayers {
  team: AfTeamInfo
  players: AfPlayerEntry[]
}

export interface AfLineupPlayer {
  player: { id: number; name: string; number: number; pos: string; grid: string | null }
}

export interface AfTeamLineup {
  team: AfTeamInfo
  coach: { id: number | null; name: string | null; photo: string | null }
  formation: string | null
  startXI: AfLineupPlayer[]
  substitutes: AfLineupPlayer[]
}

export interface AfTopScorer {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    nationality: string
    photo: string
  }
  statistics: Array<{
    team: AfTeamInfo
    goals: { total: number | null; assists: number | null }
    games: { appearences: number | null; minutes: number | null }
    cards: { yellow: number; red: number }
    penalty: { scored: number | null }
  }>
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Todos los fixtures del Mundial (para mapear IDs) */
export async function afFetchAllFixtures(): Promise<AfFixture[]> {
  return afFetch<AfFixture[]>(
    `/fixtures?league=${AF_WC_LEAGUE}&season=${AF_WC_SEASON}`
  )
}

/** Estadísticas de partido (posesión, tiros, pases, córners, etc.) */
export async function afFetchMatchStats(fixtureId: number): Promise<AfTeamStats[]> {
  return afFetch<AfTeamStats[]>(
    `/fixtures/statistics?fixture=${fixtureId}`,
    { live: true }
  )
}

/** Eventos del partido (goles, tarjetas, sustituciones con minuto) */
export async function afFetchMatchEvents(fixtureId: number): Promise<AfEvent[]> {
  return afFetch<AfEvent[]>(
    `/fixtures/events?fixture=${fixtureId}`,
    { live: true }
  )
}

/** Alineaciones de ambos equipos */
export async function afFetchLineups(fixtureId: number): Promise<AfTeamLineup[]> {
  return afFetch<AfTeamLineup[]>(
    `/fixtures/lineups?fixture=${fixtureId}`,
    { live: true }
  )
}

/** Stats individuales de jugadores en el partido */
export async function afFetchPlayerStats(fixtureId: number): Promise<AfTeamPlayers[]> {
  return afFetch<AfTeamPlayers[]>(
    `/fixtures/players?fixture=${fixtureId}`,
    { live: true }
  )
}

/** Goleadores del torneo */
export async function afFetchTopScorers(): Promise<AfTopScorer[]> {
  return afFetch<AfTopScorer[]>(
    `/players/topscorers?league=${AF_WC_LEAGUE}&season=${AF_WC_SEASON}`
  )
}

/** Asistidores del torneo */
export async function afFetchTopAssists(): Promise<AfTopScorer[]> {
  return afFetch<AfTopScorer[]>(
    `/players/topassists?league=${AF_WC_LEAGUE}&season=${AF_WC_SEASON}`
  )
}

/** Más tarjetas amarillas */
export async function afFetchTopYellowCards(): Promise<AfTopScorer[]> {
  return afFetch<AfTopScorer[]>(
    `/players/topyellowcards?league=${AF_WC_LEAGUE}&season=${AF_WC_SEASON}`
  )
}

// ─── Client-safe helpers ──────────────────────────────────────────────────────

/** Extrae el valor numérico de una estadística para ambos equipos */
export function parseAfStat(
  stats: AfTeamStats[],
  statType: string
): [number | null, number | null] {
  const [home, away] = stats
  const findVal = (ts: AfTeamStats) =>
    ts?.statistics?.find((s) => s.type === statType)?.value ?? null

  const parse = (v: string | number | null): number | null => {
    if (v == null) return null
    if (typeof v === 'number') return v
    return parseInt(v.replace('%', ''), 10) || null
  }

  return [parse(findVal(home)), parse(findVal(away))]
}
