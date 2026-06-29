import { getWorldCupFullData } from '@/lib/football-data'
import { buildMundialHighlights } from '@/lib/mundial-highlights'
import { getLeaderboard, settleFinishedMatchesIfNeeded } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const full = await getWorldCupFullData({ quick: true })
    await settleFinishedMatchesIfNeeded(full.allMatches)
    const leaderboard = await getLeaderboard(undefined, 'group')

    const {
      teams: _teams,
      groups: _groups,
      allMatches: _all,
      matchesByStage: _stages,
      knockoutRounds,
      ...worldCup
    } = full

    return NextResponse.json({
      ...worldCup,
      knockoutRounds,
      highlights: buildMundialHighlights(full.allMatches, leaderboard),
      pollaPlayers: leaderboard.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
