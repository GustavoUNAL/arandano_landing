import { getAuthUser } from '@/lib/auth-server'
import { isPollAdmin } from '@/lib/polla-admin'
import { listAllSportsUsersForAdmin, setUserPassport } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requirePollAdmin() {
  const authUser = await getAuthUser()
  if (!authUser || !isPollAdmin(authUser.email)) {
    return null
  }
  return authUser
}

export async function GET() {
  const admin = await requirePollAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const users = await listAllSportsUsersForAdmin()
    const withPassport = users.filter((u) => u.hasPassport).length
    return NextResponse.json({
      users,
      stats: {
        total: users.length,
        withPassport,
        withoutPassport: users.length - withPassport,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const admin = await requirePollAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const userId = body?.userId
    const hasPassport = body?.hasPassport

    if (typeof userId !== 'string' || typeof hasPassport !== 'boolean') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const user = await setUserPassport(userId, hasPassport)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('no encontrado') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
