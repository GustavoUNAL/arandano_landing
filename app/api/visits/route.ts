import { NextRequest, NextResponse } from 'next/server'
import { getPageVisitCount, recordSiteVisit } from '@/lib/site-visits'

export async function GET(request: NextRequest) {
  const pagePath = request.nextUrl.searchParams.get('path') || '/'
  const pageVisits = getPageVisitCount(pagePath)
  return NextResponse.json({ pageVisits, path: pagePath })
}

export async function POST(request: NextRequest) {
  try {
    let pagePath = '/'
    try {
      const body = await request.json()
      if (body?.path && typeof body.path === 'string') {
        pagePath = body.path
      }
    } catch {
      /* body vacío */
    }

    const { pageVisits } = recordSiteVisit(pagePath)
    return NextResponse.json({ pageVisits, path: pagePath })
  } catch (error) {
    console.error('[Visitas] Error:', error)
    return NextResponse.json({ error: 'No se pudo registrar la visita' }, { status: 500 })
  }
}
