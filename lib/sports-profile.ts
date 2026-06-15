import { isPollAdmin } from '@/lib/polla-admin'
import type { AuthUser } from '@/lib/auth-server'
import { getWorldCupFullData } from '@/lib/football-data'
import { getScoringRules } from '@/lib/polla-rules'
import { canViewMatchHub, getBroadcastMatchIds, isMatchPredictable } from '@/lib/sports-polla-shared'
import {
  getLeaderboard,
  getOrCreateSportsUser,
  getUserPredictions,
  settleFinishedMatches,
} from '@/lib/sports-polla'

export async function buildSportsProfilePayload(authUser: AuthUser) {
  const user = await getOrCreateSportsUser(authUser)
  const worldCup = await getWorldCupFullData()

  await settleFinishedMatches(worldCup.allMatches)

  const predictions = await getUserPredictions(user.id)
  const leaderboard = await getLeaderboard(user.id, 'group')
  const leaderboardKnockout = await getLeaderboard(user.id, 'knockout')
  const scoringRules = getScoringRules()
  const winners = leaderboard.filter((e) => e.isWinner)
  const predictionMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]))

  const enrichMatchRow = (m: (typeof worldCup.allMatches)[0]) => ({
    ...m,
    prediction: predictionMap[m.id] ?? null,
    canPredict: isMatchPredictable(m.status, m.utcDate),
    canViewHub: canViewMatchHub(m.status, m.utcDate),
  })

  const matches = worldCup.allMatches
    .filter((m) => isMatchPredictable(m.status, m.utcDate))
    .map(enrichMatchRow)

  const watchMatches = worldCup.allMatches
    .filter((m) => canViewMatchHub(m.status, m.utcDate))
    .map(enrichMatchRow)
    .reverse()
    .slice(0, 24)
    .reverse()

  const broadcastMatchIds = getBroadcastMatchIds(worldCup.allMatches)
  const hasLiveMatches = broadcastMatchIds.length > 0

  return {
    user,
    isPollAdmin: isPollAdmin(authUser.email),
    worldCup,
    matches,
    watchMatches,
    broadcastMatchIds,
    hasLiveMatches,
    predictions,
    leaderboard,
    leaderboardKnockout,
    winners,
    winnersKnockout: leaderboardKnockout.filter((e) => e.isWinner),
    scoringRules,
    predictionCost: scoringRules.predictionCost,
  }
}

export type SportsProfilePayload = Awaited<ReturnType<typeof buildSportsProfilePayload>>
