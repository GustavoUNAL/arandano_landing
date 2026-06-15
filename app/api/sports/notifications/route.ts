import { getAuthUser } from '@/lib/auth-server'
import { buildSportsNotificationsPayload } from '@/lib/sports-notifications-payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const payload = await buildSportsNotificationsPayload(authUser)
    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
