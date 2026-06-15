import { getAuthUser } from '@/lib/auth-server'
import { isPollaPushConfigured } from '@/lib/polla-push-server'
import {
  deletePushSubscription,
  upsertPushSubscription,
  type PushSubscriptionInput,
} from '@/lib/polla-push-subscriptions'
import { getOrCreateSportsUser } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function parseSubscription(body: unknown): PushSubscriptionInput | null {
  if (!body || typeof body !== 'object') return null
  const endpoint = (body as { endpoint?: unknown }).endpoint
  const keys = (body as { keys?: unknown }).keys
  if (typeof endpoint !== 'string' || !endpoint) return null
  if (!keys || typeof keys !== 'object') return null
  const p256dh = (keys as { p256dh?: unknown }).p256dh
  const auth = (keys as { auth?: unknown }).auth
  if (typeof p256dh !== 'string' || typeof auth !== 'string') return null
  return { endpoint, keys: { p256dh, auth } }
}

export async function POST(request: Request) {
  if (!isPollaPushConfigured()) {
    return NextResponse.json({ error: 'Push no configurado' }, { status: 503 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subscription = parseSubscription(body)
    if (!subscription) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    const user = await getOrCreateSportsUser(authUser)
    const userAgent = request.headers.get('user-agent')
    await upsertPushSubscription(user.id, subscription, userAgent)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const endpoint = body?.endpoint
    if (typeof endpoint !== 'string' || !endpoint) {
      return NextResponse.json({ error: 'Endpoint inválido' }, { status: 400 })
    }

    const user = await getOrCreateSportsUser(authUser)
    await deletePushSubscription(user.id, endpoint)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
