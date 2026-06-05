import { NextRequest, NextResponse } from 'next/server'
import { getSeoDashboard } from '@/lib/site-analytics'

export async function GET(request: NextRequest) {
  try {
    const daysParam = request.nextUrl.searchParams.get('days')
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) : 30
    const dashboard = getSeoDashboard(days)
    return NextResponse.json({ ...dashboard, days })
  } catch (error) {
    console.error('[SEO] Error:', error)
    return NextResponse.json({ error: 'No se pudieron cargar las estadísticas' }, { status: 500 })
  }
}
