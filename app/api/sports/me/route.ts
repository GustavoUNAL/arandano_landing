import { getAuthUser } from '@/lib/auth-server'
import { isPollAdmin } from '@/lib/polla-admin'
import { getWorldCupFullData } from '@/lib/football-data'
import { getScoringRules } from '@/lib/polla-rules'
import { canViewMatchHub, getBroadcastMatchIds, isMatchHappeningNow } from '@/lib/sports-polla-shared'
import {
  getLeaderboard,
  getOrCreateSportsUser,
  getUserPredictions,
  isMatchPredictable,
  settleFinishedMatches,
  updateDisplayAlias,
} from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    return NextResponse.json({
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
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const displayAlias = body?.displayAlias
    if (typeof displayAlias !== 'string') {
      return NextResponse.json({ error: 'Nombre de usuario inválido' }, { status: 400 })
    }

    const user = await updateDisplayAlias(authUser.id, displayAlias)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('ya está en uso') || message.includes('caracteres') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
