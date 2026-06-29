import { getAuthUser } from '@/lib/auth-server'
import { isPollAdmin } from '@/lib/polla-admin'
import { resolvePassportReceiptPath } from '@/lib/passport-receipt-storage'
import { dbGet } from '@/lib/db'
import fs from 'fs'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser()
  if (!authUser || !isPollAdmin(authUser.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const row = await dbGet<{ receiptPath: string | null }>(
    'SELECT receiptPath FROM knockout_passport_requests WHERE id = ?',
    [params.id]
  )
  if (!row?.receiptPath) {
    return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
  }

  const fullPath = resolvePassportReceiptPath(row.receiptPath)
  if (!fullPath) {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
  }

  const buffer = fs.readFileSync(fullPath)
  const ext = fullPath.split('.').pop()?.toLowerCase()
  const contentType =
    ext === 'pdf'
      ? 'application/pdf'
      : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=60',
    },
  })
}
