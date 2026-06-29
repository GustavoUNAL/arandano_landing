import { getAuthUser } from '@/lib/auth-server'
<<<<<<< HEAD
import { buildSportsProfilePayload } from '@/lib/sports-profile'
=======
import { isPollAdmin } from '@/lib/polla-admin'
import { countKnockoutPassportHolders } from '@/lib/passport-requests'
import { getWorldCupFullData } from '@/lib/football-data'
import { isGroupStageComplete } from '@/lib/polla-phase'
import {
  computeKnockoutPrizePoolCOP,
  getKnockoutPrizeBreakdown,
  getScoringRules,
} from '@/lib/polla-rules'
import { findUserGroupWinnerEntry } from '@/lib/polla-winners'
import { canViewMatchHub, getBroadcastMatchIds } from '@/lib/sports-polla-shared'
import {
  getLeaderboard,
  getOrCreateSportsUser,
  getUserPredictions,
  isMatchPredictable,
  settleFinishedMatchesIfNeeded,
  skipWhatsAppPrompt,
  updateDisplayAlias,
  updateUserWhatsApp,
} from '@/lib/sports-polla'
>>>>>>> 91e8f9d (update fin polla 1)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
<<<<<<< HEAD
    const payload = await buildSportsProfilePayload(authUser)
    return NextResponse.json(payload)
=======
    const [user, worldCup] = await Promise.all([
      getOrCreateSportsUser(authUser),
      getWorldCupFullData({ quick: true }),
    ])

    await settleFinishedMatchesIfNeeded(worldCup.allMatches)

    const [predictions, leaderboard, leaderboardKnockout, passportHolders] = await Promise.all([
      getUserPredictions(user.id),
      getLeaderboard(user.id, 'group'),
      getLeaderboard(user.id, 'knockout'),
      countKnockoutPassportHolders(),
    ])

    const scoringRules = getScoringRules()
    const winners = leaderboard.filter((e) => e.isWinner)
    const groupComplete = isGroupStageComplete(worldCup.allMatches)
    const knockoutPrizeBreakdown = getKnockoutPrizeBreakdown(passportHolders)
    const groupWinnerEntry = findUserGroupWinnerEntry(
      authUser.email,
      winners,
      leaderboard,
      true
    )
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

    void getWorldCupFullData().catch(() => {})

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
      groupComplete,
      groupWinnerEntry,
      passportHolders,
      knockoutPrizePoolCop: computeKnockoutPrizePoolCOP(passportHolders),
      knockoutPrizeBreakdown,
      scoringRules,
      predictionCost: scoringRules.predictionCost,
    })
>>>>>>> 91e8f9d (update fin polla 1)
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
    const whatsapp = body?.whatsapp
    const skipWhatsApp = body?.skipWhatsAppPrompt

    if (typeof skipWhatsApp === 'boolean' && skipWhatsApp) {
      const user = await skipWhatsAppPrompt(authUser.id)
      return NextResponse.json({ user })
    }

<<<<<<< HEAD
    const { updateDisplayAlias } = await import('@/lib/sports-polla')
    const user = await updateDisplayAlias(authUser.id, displayAlias)
    return NextResponse.json({ user })
=======
    if (typeof whatsapp === 'string' && whatsapp.trim()) {
      const user = await updateUserWhatsApp(authUser.id, whatsapp)
      return NextResponse.json({ user })
    }

    if (typeof displayAlias === 'string') {
      const user = await updateDisplayAlias(authUser.id, displayAlias)
      return NextResponse.json({ user })
    }

    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
>>>>>>> 91e8f9d (update fin polla 1)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status =
      message.includes('ya está en uso') ||
      message.includes('caracteres') ||
      message.includes('celular') ||
      message.includes('válido')
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
