import type { AuthUser } from '@/lib/auth-server'
import { getWorldCupFullData } from '@/lib/football-data'
import { canViewMatchHub, isMatchPredictable } from '@/lib/sports-polla-shared'
import { getOrCreateSportsUser, getUserPredictions } from '@/lib/sports-polla'

/** Datos mínimos para la campana de alertas — sin leaderboard ni liquidación pesada. */
export async function buildSportsNotificationsPayload(authUser: AuthUser) {
  const user = await getOrCreateSportsUser(authUser)
  const [worldCup, predictions] = await Promise.all([
    getWorldCupFullData(),
    getUserPredictions(user.id),
  ])

  const predictionMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]))

  const toRow = (m: (typeof worldCup.allMatches)[0]) => ({
    id: m.id,
    utcDate: m.utcDate,
    homeTeam: {
      shortName: m.homeTeam.shortName,
      name: m.homeTeam.name,
      tla: m.homeTeam.tla,
    },
    awayTeam: {
      shortName: m.awayTeam.shortName,
      name: m.awayTeam.name,
      tla: m.awayTeam.tla,
    },
    isFinished: m.isFinished,
    canPredict: isMatchPredictable(m.status, m.utcDate),
    prediction: predictionMap[m.id] ?? null,
    startsIn: m.startsIn,
    formattedDate: m.formattedDate,
  })

  const predictable = worldCup.allMatches.filter((m) => isMatchPredictable(m.status, m.utcDate))
  const watch = worldCup.allMatches
    .filter((m) => canViewMatchHub(m.status, m.utcDate))
    .slice(-24)

  const matches = [...new Map([...predictable, ...watch].map((m) => [m.id, toRow(m)])).values()]

  return {
    matches,
    predictions,
    user: { id: user.id, credits: user.credits },
  }
}
