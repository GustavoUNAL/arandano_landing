import { settleFinishedMatches } from '@/lib/sports-polla'

const SETTLE_MIN_INTERVAL_MS = 90_000
let lastSettleAt = 0
let settleInflight: Promise<number> | null = null

/** Liquida partidos finalizados como máximo cada ~90 s (evita bloquear cada /api/sports/me). */
export async function maybeSettleFinishedMatches(
  finishedMatches: Array<{
    id: number
    status: string
    score: { fullTime: { home: number | null; away: number | null } }
  }>
): Promise<number> {
  const now = Date.now()
  if (now - lastSettleAt < SETTLE_MIN_INTERVAL_MS) return 0
  if (settleInflight) return settleInflight

  settleInflight = (async () => {
    try {
      const settled = await settleFinishedMatches(finishedMatches)
      lastSettleAt = Date.now()
      return settled
    } finally {
      settleInflight = null
    }
  })()

  return settleInflight
}
