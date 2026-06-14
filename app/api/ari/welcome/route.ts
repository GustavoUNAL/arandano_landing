import { getAuthUser } from '@/lib/auth-server'
import { generateAriWelcome } from '@/lib/ari/orchestrator'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.ARI_ENABLED === 'false') {
    return NextResponse.json({ error: 'Predictor no está habilitado' }, { status: 503 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await generateAriWelcome(authUser)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[ari/welcome]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
