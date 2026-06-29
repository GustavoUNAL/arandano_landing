import { getAuthUser } from '@/lib/auth-server'
import { isPollAdmin } from '@/lib/polla-admin'
import {
  countPendingPassportRequests,
  listPassportRequestsForAdmin,
  reviewPassportRequest,
} from '@/lib/passport-requests'
import type { PassportRequestStatus } from '@/lib/polla-rules'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requirePollAdmin() {
  const authUser = await getAuthUser()
  if (!authUser || !isPollAdmin(authUser.email)) return null
  return authUser
}

export async function GET(request: Request) {
  const admin = await requirePollAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const status =
      statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected'
        ? (statusParam as PassportRequestStatus)
        : undefined

    const [requests, pendingCount] = await Promise.all([
      listPassportRequestsForAdmin(status),
      countPendingPassportRequests(),
    ])

    return NextResponse.json({ requests, pendingCount })
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
    const requestId = body?.requestId
    const action = body?.action
    const adminNote = typeof body?.adminNote === 'string' ? body.adminNote : undefined

    if (typeof requestId !== 'string' || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const updated = await reviewPassportRequest({
      requestId,
      action,
      adminEmail: admin.email ?? 'admin',
      adminNote,
    })

    return NextResponse.json({ request: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('no encontrada') || message.includes('revisada') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
