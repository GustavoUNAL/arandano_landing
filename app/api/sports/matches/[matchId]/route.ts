import { getAuthUser } from '@/lib/auth-server'
import { getMatchById } from '@/lib/football-data'
import {
  getMatchPredictionStats,
  getOrCreateSportsUser,
  getPrediction,
  settleFinishedMatches,
} from '@/lib/sports-polla'
import { canViewMatchHub } from '@/lib/sports-polla-shared'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { matchId: matchIdRaw } = await params
  const matchId = Number(matchIdRaw)
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: 'Partido inválido' }, { status: 400 })
  }

  try {
    const user = await getOrCreateSportsUser(authUser)
    const match = await getMatchById(matchId)

    if (!canViewMatchHub(match.status, match.utcDate)) {
      return NextResponse.json(
        { error: 'Este partido aún no ha comenzado' },
        { status: 400 }
      )
    }

    await settleFinishedMatches([match])

    const [{ stats, picks }, userPrediction] = await Promise.all([
      getMatchPredictionStats(matchId, user.id),
      getPrediction(user.id, matchId),
    ])

    return NextResponse.json({
      match,
      stats,
      picks,
      userPrediction,
      refreshedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
