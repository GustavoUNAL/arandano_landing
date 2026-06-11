import { getAuthUser } from '@/lib/auth-server'
import { getWorldCupFullData } from '@/lib/football-data'
import { getScoringRules } from '@/lib/polla-rules'
import { getLeaderboard, settleFinishedMatches } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const worldCup = await getWorldCupFullData()
    await settleFinishedMatches(worldCup.allMatches)

    const authUser = await getAuthUser()
    const leaderboard = await getLeaderboard(authUser?.id)
    const scoringRules = getScoringRules()
    const winners = leaderboard.filter((e) => e.isWinner)

    return NextResponse.json({
      leaderboard,
      winners,
      scoringRules,
      updatedAt: new Date().toISOString(),
      playedMatches: worldCup.stats.playedMatches,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
