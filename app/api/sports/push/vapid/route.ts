import { getPollaVapidPublicKey, isPollaPushConfigured } from '@/lib/polla-push-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isPollaPushConfigured()) {
    return NextResponse.json({ error: 'Push no configurado en el servidor' }, { status: 503 })
  }

  return NextResponse.json({ publicKey: getPollaVapidPublicKey() })
}
