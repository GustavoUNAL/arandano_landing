import { getAuthUser } from '@/lib/auth-server'
import { AriPredictorUnavailableError, unavailableResponse } from '@/lib/ari/errors'
import { checkRateLimit, runAriChat } from '@/lib/ari/orchestrator'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  if (process.env.ARI_ENABLED === 'false') {
    return NextResponse.json({ error: 'Predictor no está habilitado' }, { status: 503 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en el servidor' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const message = String(body.message ?? '').trim()
    if (!message || message.length > 300) {
      return NextResponse.json({ error: 'Mensaje inválido (máx 300 caracteres)' }, { status: 400 })
    }

    const allowed = await checkRateLimit(authUser.id)
    if (!allowed) {
      const err = new AriPredictorUnavailableError('rate_limit')
      return NextResponse.json(unavailableResponse(err), { status: 429 })
    }

    const result = await runAriChat({
      authUser,
      message,
      threadId: body.threadId ? String(body.threadId) : undefined,
      matchId: body.matchId ? Number(body.matchId) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AriPredictorUnavailableError) {
      return NextResponse.json(unavailableResponse(error), { status: 503 })
    }
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[ari/chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
