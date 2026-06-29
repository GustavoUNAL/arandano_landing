/**
 * Modelos y lógica compartida (cliente + servidor) — Polla Mundialista 2026
 */

import {
  INITIAL_CREDITS,
  LEGACY_INITIAL_CREDITS,
  MAX_SCORE_PER_TEAM,
  MIN_SETTLED_PICKS_TO_WIN,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  PREDICTION_COST,
  TOP_WINNERS_COUNT,
  type PointsTier,
} from '@/lib/polla-rules'

export {
  INITIAL_CREDITS,
  LEGACY_INITIAL_CREDITS,
  MAX_SCORE_PER_TEAM,
  MIN_SETTLED_PICKS_TO_WIN,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  PREDICTION_COST,
  TOP_WINNERS_COUNT,
  type PointsTier,
}

const PREDICTABLE_STATUSES = new Set(['SCHEDULED', 'TIMED'])

export const LIVE_MATCH_STATUSES = new Set([
  'IN_PLAY',
  'LIVE',
  'PAUSED',
  'EXTRA_TIME',
  'PENALTY_SHOOTOUT',
])

export const FINISHED_MATCH_STATUSES = new Set(['FINISHED', 'AWARDED'])

/** Ventana típica de un partido (minutos + descanso + prórroga posible). */
const MATCH_WINDOW_MS = 3 * 60 * 60 * 1000

export function isMatchLive(status: string): boolean {
  return LIVE_MATCH_STATUSES.has(status)
}

export function isMatchFinished(status: string): boolean {
  return FINISHED_MATCH_STATUSES.has(status)
}

export function isMatchStarted(status: string): boolean {
  return isMatchLive(status) || isMatchFinished(status) || status === 'SUSPENDED'
}

/** Partido en curso o recién iniciado (aunque la API aún diga TIMED). */
export function isMatchHappeningNow(status: string, utcDate: string): boolean {
  if (isMatchLive(status)) return true
  if (isMatchFinished(status)) return false
  if (['POSTPONED', 'CANCELLED', 'SCHEDULED'].includes(status)) return false
  const kickoff = new Date(utcDate).getTime()
  const now = Date.now()
  return kickoff <= now && now - kickoff < MATCH_WINDOW_MS
}

export function canViewMatchHub(status: string, utcDate: string): boolean {
  if (isMatchLive(status) || isMatchFinished(status) || status === 'SUSPENDED') return true
  if (['POSTPONED', 'CANCELLED'].includes(status)) return false
  // Pitazo ya pasó: permitir ver marcador/stats aunque el status siga TIMED
  return new Date(utcDate).getTime() <= Date.now()
}

/** IDs para el bloque de transmisión en el perfil. */
export function getBroadcastMatchIds(
  matches: Array<{ id: number; status: string; utcDate: string; isLive?: boolean }>
): number[] {
  const live = matches.filter((m) => isMatchLive(m.status) || m.isLive)
  if (live.length > 0) {
    return live
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .map((m) => m.id)
  }
  const happening = matches.filter((m) => isMatchHappeningNow(m.status, m.utcDate))
  if (happening.length > 0) {
    return happening
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .map((m) => m.id)
  }
  return []
}

export function normalizeHasPassport(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function normalizeHasKnockoutPassport(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function normalizeWhatsappPromptSkipped(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export interface SportsUser {
  id: string
  email: string
  name: string | null
  image: string | null
  credits: number
  displayAlias: string | null
  whatsapp: string | null
  whatsappPromptSkipped: boolean
  totalPoints: number
  hasPassport: boolean
  hasKnockoutPassport: boolean
  lastCreditsRechargeDate: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminSportsUserRow {
  id: string
  email: string
  name: string | null
  image: string | null
  credits: number
  displayAlias: string | null
  totalPoints: number
  hasPassport: boolean
  hasKnockoutPassport: boolean
  picksCount: number
  settledCount: number
  createdAt: string
  updatedAt: string
  whatsapp: string | null
}

export interface MatchPrediction {
  id: string
  userId: string
  matchId: number
  homeTeamName: string
  awayTeamName: string
  homeTeamCrest: string | null
  awayTeamCrest: string | null
  matchDate: string
  matchGroup: string | null
  homeScore: number
  awayScore: number
  creditsWagered: number
  actualHomeScore: number | null
  actualAwayScore: number | null
  pointsEarned: number | null
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MatchPickDistribution {
  homeScore: number
  awayScore: number
  count: number
  percentage: number
}

export interface MatchPredictionStats {
  totalPicks: number
  distribution: MatchPickDistribution[]
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  avgHomeGoals: number
  avgAwayGoals: number
}

export interface PublicMatchPick {
  displayAlias: string
  homeScore: number
  awayScore: number
  isCurrentUser: boolean
}

export interface LeaderboardEntry {
  rank: number
  name: string | null
  displayAlias: string
  totalPoints: number
  picksCount: number
  settledCount: number
  exactHits: number
  goalDiffHits: number
  resultHits: number
  hasPassport: boolean
  hasKnockoutPassport: boolean
  phase: 'group' | 'knockout' | 'training'
  qualifiesForPodium: boolean
  isWinner: boolean
  winnerRank: number | null
  isCurrentUser: boolean
}

export function isMatchPredictable(status: string, utcDate: string): boolean {
  if (!PREDICTABLE_STATUSES.has(status)) return false
  return new Date(utcDate).getTime() > Date.now()
}

export function getPredictionTier(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): PointsTier {
  if (predHome === actualHome && predAway === actualAway) return 'exact'

  const predDiff = predHome - predAway
  const actualDiff = actualHome - actualAway

  if (predDiff === actualDiff) return 'goal_diff'

  if (Math.sign(predDiff) === Math.sign(actualDiff)) return 'result'

  return 'miss'
}

export function calculatePredictionPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  const tier = getPredictionTier(predHome, predAway, actualHome, actualAway)
  switch (tier) {
    case 'exact':
      return POINTS_EXACT_SCORE
    case 'goal_diff':
      return POINTS_GOAL_DIFFERENCE
    case 'result':
      return POINTS_CORRECT_RESULT
    default:
      return 0
  }
}

export function tierLabel(tier: PointsTier): string {
  switch (tier) {
    case 'exact':
      return 'Marcador exacto'
    case 'goal_diff':
      return 'Diferencia de goles'
    case 'result':
      return 'Resultado'
    default:
      return 'Sin acierto'
  }
}

export function pointsToTier(points: number | null): PointsTier {
  if (points === POINTS_EXACT_SCORE) return 'exact'
  if (points === POINTS_GOAL_DIFFERENCE) return 'goal_diff'
  if (points === POINTS_CORRECT_RESULT) return 'result'
  return 'miss'
}

/** Marca ganadores entre jugadores que cumplen el mínimo de picks calificados en la fase. */
export function applyWinnerRanks(
  entries: LeaderboardEntry[],
  maxWinners: number = TOP_WINNERS_COUNT
): LeaderboardEntry[] {
  const qualified = entries.filter((e) => e.qualifiesForPodium)
  const winnerIds = new Set(qualified.slice(0, maxWinners).map((e) => e.displayAlias))

  return entries.map((entry) => {
    const qualifiedIndex = qualified.findIndex((q) => q.displayAlias === entry.displayAlias)
    const isWinner = winnerIds.has(entry.displayAlias) && entry.qualifiesForPodium
    return {
      ...entry,
      isWinner,
      winnerRank: isWinner ? qualifiedIndex + 1 : null,
    }
  })
}
