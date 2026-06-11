import { getAuthUser } from '@/lib/auth-server'
import { isPollAdmin } from '@/lib/polla-admin'
import {
  listAllSportsUsersForAdmin,
  setUserKnockoutPassport,
  setUserPassport,
} from '@/lib/sports-polla'
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
    const withKnockoutPassport = users.filter((u) => u.hasKnockoutPassport).length
    return NextResponse.json({
      users,
      stats: {
        total: users.length,
        withPassport,
        withoutPassport: users.length - withPassport,
        withKnockoutPassport,
        withoutKnockoutPassport: users.length - withKnockoutPassport,
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
    const hasKnockoutPassport = body?.hasKnockoutPassport

    if (typeof userId !== 'string') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    if (typeof hasPassport === 'boolean') {
      const user = await setUserPassport(userId, hasPassport)
      return NextResponse.json({ user })
    }

    if (typeof hasKnockoutPassport === 'boolean') {
      const user = await setUserKnockoutPassport(userId, hasKnockoutPassport)
      return NextResponse.json({ user })
    }

    return NextResponse.json({ error: 'Indica hasPassport o hasKnockoutPassport' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('no encontrado') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
