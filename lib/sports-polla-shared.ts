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

export function normalizeHasPassport(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function normalizeHasKnockoutPassport(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export interface SportsUser {
  id: string
  email: string
  name: string | null
  image: string | null
  credits: number
  displayAlias: string | null
  totalPoints: number
  hasPassport: boolean
  hasKnockoutPassport: boolean
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

export interface LeaderboardEntry {
  rank: number
  displayAlias: string
  totalPoints: number
  picksCount: number
  settledCount: number
  exactHits: number
  goalDiffHits: number
  resultHits: number
  hasPassport: boolean
  hasKnockoutPassport: boolean
  phase: 'group' | 'knockout'
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
