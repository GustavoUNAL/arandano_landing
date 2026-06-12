/** Utilidades de presentación para marcadores y resultados */

export type MatchWinnerSide = 'home' | 'away' | 'draw' | null

export function getFinishedMatchWinner(match: {
  isFinished?: boolean
  displayScore: { home: number | null; away: number | null }
}): MatchWinnerSide {
  if (!match.isFinished) return null
  const { home, away } = match.displayScore
  if (home == null || away == null) return null
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function winnerBadge(side: MatchWinnerSide, forSide: 'home' | 'away'): string | null {
  if (side === 'draw') return forSide === 'home' ? '🤝' : null
  if (side === forSide) return '⭐'
  return null
}
