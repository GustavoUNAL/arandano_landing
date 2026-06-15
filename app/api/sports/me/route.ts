import { getAuthUser } from '@/lib/auth-server'
import { buildSportsProfilePayload } from '@/lib/sports-profile'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const payload = await buildSportsProfilePayload(authUser)
    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const displayAlias = body?.displayAlias
    if (typeof displayAlias !== 'string') {
      return NextResponse.json({ error: 'Nombre de usuario inválido' }, { status: 400 })
    }

    const { updateDisplayAlias } = await import('@/lib/sports-polla')
    const user = await updateDisplayAlias(authUser.id, displayAlias)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('ya está en uso') || message.includes('caracteres') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
