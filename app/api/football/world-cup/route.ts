import { getWorldCupData } from '@/lib/football-data'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getWorldCupData()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
