import {
  CONDICIONES_LEGALES,
  getScoringRules,
  REGLAMENTO_SECTIONS,
  REGLAMENTO_SHORT,
} from '@/lib/polla-rules'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    scoringRules: getScoringRules(),
    reglamentoShort: REGLAMENTO_SHORT,
    sections: REGLAMENTO_SECTIONS,
    condicionesLegales: CONDICIONES_LEGALES,
  })
}
