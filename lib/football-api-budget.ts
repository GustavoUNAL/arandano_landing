import { dbGet, dbRun } from '@/lib/db'

export const FOOTBALL_API_DAILY_LIMIT = Number(process.env.FOOTBALL_API_DAILY_LIMIT ?? 100)

function usageDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getFootballApiUsageToday(): Promise<number> {
  const row = await dbGet<{ count: number }>(
    'SELECT count FROM sports_api_usage WHERE usageDate = ?',
    [usageDateKey()]
  )
  return Number(row?.count ?? 0)
}

export async function getFootballApiRemainingToday(): Promise<number> {
  return Math.max(0, FOOTBALL_API_DAILY_LIMIT - (await getFootballApiUsageToday()))
}

export async function canUseFootballApi(calls = 1): Promise<boolean> {
  return (await getFootballApiUsageToday()) + calls <= FOOTBALL_API_DAILY_LIMIT
}

export async function recordFootballApiCalls(calls = 1): Promise<void> {
  if (calls <= 0) return
  const usageDate = usageDateKey()
  await dbRun(
    `INSERT INTO sports_api_usage (usageDate, count) VALUES (?, ?)
     ON CONFLICT(usageDate) DO UPDATE SET count = sports_api_usage.count + excluded.count`,
    [usageDate, calls]
  )
}

/** Registra uso solo si hay cupo; devuelve false si la cuota diaria está llena. */
export async function reserveFootballApiCalls(calls = 1): Promise<boolean> {
  if (calls <= 0) return true
  const used = await getFootballApiUsageToday()
  if (used + calls > FOOTBALL_API_DAILY_LIMIT) {
    console.warn(
      `[football-api] Cuota diaria agotada: ${used}/${FOOTBALL_API_DAILY_LIMIT} (se pidieron ${calls} más)`
    )
    return false
  }
  await recordFootballApiCalls(calls)
  return true
}
