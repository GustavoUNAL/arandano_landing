import { getAfMatchDetail, setAfFixtureId } from '@/lib/api-football-stats'
import { dbGet } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const fdMatchId = Number(params.matchId)
  if (!Number.isFinite(fdMatchId)) {
    return NextResponse.json({ error: 'matchId inválido' }, { status: 400 })
  }

  const matchRow = await dbGet<{ status: string }>(
    'SELECT status FROM sports_matches WHERE id = ?',
    [fdMatchId]
  )
  const isLive = ['IN_PLAY', 'LIVE', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(
    matchRow?.status ?? ''
  )

  const detail = await getAfMatchDetail(fdMatchId, { isLive })

  if (!detail) {
    return NextResponse.json(
      { error: 'Estadísticas no disponibles (API_FOOTBALL_KEY no configurado o partido no mapeado)' },
      { status: 404 }
    )
  }

  return NextResponse.json(detail)
}

/** Admin: vincular manualmente un fd match ID con un af fixture ID */
export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions)
  const adminEmails = (process.env.POLL_ADMIN_EMAIL ?? 'gustavoarteaga0508@gmail.com').split(',')
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json() as { afFixtureId?: number }
  const { afFixtureId } = body
  if (!afFixtureId) return NextResponse.json({ error: 'afFixtureId requerido' }, { status: 400 })

  await setAfFixtureId(Number(params.matchId), afFixtureId)
  return NextResponse.json({ ok: true })
}
