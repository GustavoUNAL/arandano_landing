import { getAuthUser } from '@/lib/auth-server'
import { getMatchById, getWorldCupFullData } from '@/lib/football-data'
import { getFeaturedMatchForHome, getKickoffCountdown } from '@/lib/home-broadcast'
import { getMatchPredictionStats } from '@/lib/sports-polla'
import { canViewMatchHub } from '@/lib/sports-polla-shared'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const worldCup = await getWorldCupFullData()
    const featured = getFeaturedMatchForHome(worldCup.allMatches)

    if (!featured) {
      return NextResponse.json({
        featured: null,
        refreshedAt: new Date().toISOString(),
      })
    }

    const { match, mode } = featured
    const authUser = await getAuthUser()
    const [{ stats, picks }, matchDetail] = await Promise.all([
      getMatchPredictionStats(match.id, authUser?.id),
      mode === 'live' && canViewMatchHub(match.status, match.utcDate)
        ? getMatchById(match.id).catch(() => null)
        : Promise.resolve(null),
    ])

    const recentPicks = [...picks].reverse().slice(0, 12)
    const countdown = mode === 'upcoming' ? getKickoffCountdown(match.utcDate) : null

    return NextResponse.json({
      featured: {
        mode,
        countdown,
        match: matchDetail ?? match,
        stats,
        picks: recentPicks,
        totalPicks: stats.totalPicks,
      },
      refreshedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
