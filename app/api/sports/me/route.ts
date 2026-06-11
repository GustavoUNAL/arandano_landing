import { getAuthUser } from '@/lib/auth-server'
import { getWorldCupFullData } from '@/lib/football-data'
import { getScoringRules } from '@/lib/polla-rules'
import {
  getLeaderboard,
  getOrCreateSportsUser,
  getUserPredictions,
  isMatchPredictable,
  settleFinishedMatches,
} from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const user = await getOrCreateSportsUser(authUser)
    const worldCup = await getWorldCupFullData()

    await settleFinishedMatches(worldCup.allMatches)

    const predictions = await getUserPredictions(user.id)
    const leaderboard = await getLeaderboard(user.id)
    const scoringRules = getScoringRules()
    const winners = leaderboard.filter((e) => e.isWinner)
    const predictionMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]))

    const matches = worldCup.allMatches
      .filter((m) => isMatchPredictable(m.status, m.utcDate))
      .map((m) => ({
        ...m,
        prediction: predictionMap[m.id] ?? null,
        canPredict: isMatchPredictable(m.status, m.utcDate),
      }))

    return NextResponse.json({
      user,
      worldCup,
      matches,
      predictions,
      leaderboard,
      winners,
      scoringRules,
      predictionCost: scoringRules.predictionCost,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
