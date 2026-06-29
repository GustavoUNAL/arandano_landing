import { getAuthUser } from '@/lib/auth-server'
import {
  createPassportRequest,
  getLatestPassportRequestForUser,
} from '@/lib/passport-requests'
import { KNOCKOUT_PASSPORT_PRICE_COP } from '@/lib/polla-rules'
import { getOrCreateSportsUser } from '@/lib/sports-polla'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const user = await getOrCreateSportsUser(authUser)
    const request = await getLatestPassportRequestForUser(user.id)
    return NextResponse.json({
      hasKnockoutPassport: user.hasKnockoutPassport,
      priceCop: KNOCKOUT_PASSPORT_PRICE_COP,
      request,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    let userNote: string | undefined
    let receiptFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const note = form.get('userNote')
      const receipt = form.get('receipt')
      if (typeof note === 'string' && note.trim()) userNote = note
      if (receipt instanceof File && receipt.size > 0) receiptFile = receipt
    } else {
      const body = await request.json().catch(() => ({}))
      if (typeof body?.userNote === 'string') userNote = body.userNote
    }

    if (!receiptFile) {
      return NextResponse.json({ error: 'Debes adjuntar el comprobante de pago.' }, { status: 400 })
    }

    const user = await getOrCreateSportsUser(authUser)
    const created = await createPassportRequest(user.id, { userNote, receiptFile })
    return NextResponse.json({ request: created })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status =
      message.includes('pendiente') ||
      message.includes('activo') ||
      message.includes('comprobante') ||
      message.includes('Adjunta')
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
