import { getTournamentStats } from '@/lib/api-football-stats'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const stats = await getTournamentStats()
  if (!stats) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY no configurado' }, { status: 503 })
  }

  return NextResponse.json(stats)
}
