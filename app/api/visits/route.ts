import { NextRequest, NextResponse } from 'next/server'
import { recordPageEngagement, recordSiteClick } from '@/lib/site-analytics'
import { getPageVisitCount, recordSiteVisit } from '@/lib/site-visits'

async function parseJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await request.text()
    if (!text.trim()) return {}
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  const pagePath = request.nextUrl.searchParams.get('path') || '/'
  const pageVisits = getPageVisitCount(pagePath)
  return NextResponse.json({ pageVisits, path: pagePath })
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request)
    const type = body.type as string | undefined

    if (type === 'click') {
      const pagePath = typeof body.path === 'string' ? body.path : '/'
      const label = typeof body.label === 'string' ? body.label : 'click'
      const target = typeof body.target === 'string' ? body.target : ''
      recordSiteClick(pagePath, label, target)
      return NextResponse.json({ ok: true })
    }

    if (type === 'engagement') {
      const pagePath = typeof body.path === 'string' ? body.path : '/'
      const durationSeconds =
        typeof body.durationSeconds === 'number' ? body.durationSeconds : 0
      recordPageEngagement(pagePath, durationSeconds)
      return NextResponse.json({ ok: true })
    }

    const pagePath = typeof body.path === 'string' ? body.path : '/'
    const { pageVisits } = recordSiteVisit(pagePath)
    return NextResponse.json({ pageVisits, path: pagePath })
  } catch (error) {
    console.error('[Visitas] Error:', error)
    return NextResponse.json({ error: 'No se pudo registrar la visita' }, { status: 500 })
  }
}
