import { getAuthUser } from '@/lib/auth-server'
import { getWorldCupFullData } from '@/lib/football-data'
import { getScoringRules } from '@/lib/polla-rules'
import { getOrCreateSportsUser, isMatchPredictable, savePrediction } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await getOrCreateSportsUser(authUser)

    const body = await request.json()
    const { matchId, homeScore, awayScore } = body

    if (matchId == null || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const worldCup = await getWorldCupFullData()
    const match = worldCup.allMatches.find((m) => m.id === Number(matchId))
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
    }

    if (!isMatchPredictable(match.status, match.utcDate)) {
      return NextResponse.json(
        { error: 'El partido ya comenzó. No puedes pronosticar.' },
        { status: 400 }
      )
    }

    const result = await savePrediction({
      userId: authUser.id,
      matchId: match.id,
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      homeTeamCrest: match.homeTeam.crest,
      awayTeamCrest: match.awayTeam.crest,
      matchDate: match.utcDate,
      matchStatus: match.status,
      matchGroup: match.group,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
    })

    return NextResponse.json({
      ...result,
      scoringRules: getScoringRules(),
      message:
        result.creditsCharged > 0
          ? `Pronóstico guardado. Se descontaron ${result.creditsCharged} créditos.`
          : 'Pronóstico actualizado sin costo adicional.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
