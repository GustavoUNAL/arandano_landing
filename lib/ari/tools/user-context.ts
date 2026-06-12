import { getWorldCupFullData } from '@/lib/football-data'
import { dbGet } from '@/lib/db'
import { getLeaderboard, getOrCreateSportsUser, getUserPredictions } from '@/lib/sports-polla'
import type { AuthUser } from '@/lib/auth-server'

const COLOMBIA_TZ = 'America/Bogota'

function colombiaDateKey(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: COLOMBIA_TZ })
}

function isTodayInColombia(utcDate: string): boolean {
  const d = new Date(utcDate)
  const key = d.toLocaleDateString('en-CA', { timeZone: COLOMBIA_TZ })
  return key === colombiaDateKey()
}

export async function getUserPollContext(authUser: AuthUser) {
  const user = await getOrCreateSportsUser(authUser)
  const [leaderboard, predictions, worldCup, totalRow] = await Promise.all([
    getLeaderboard(user.id, 'group'),
    getUserPredictions(user.id),
    getWorldCupFullData(),
    dbGet<{ c: number }>('SELECT COUNT(*) AS c FROM sports_users'),
  ])

  const totalParticipants = Number(totalRow?.c ?? leaderboard.length)
  const myEntry = leaderboard.find((e) => e.isCurrentUser)
  const rank = myEntry?.rank ?? totalParticipants
  const leader = leaderboard[0]
  const top5 = leaderboard[4]
  const leaderPoints = leader?.totalPoints ?? 0
  const myPoints = myEntry?.totalPoints ?? user.totalPoints
  const pointsToTop5 = top5 ? Math.max(0, top5.totalPoints - myPoints) : 0

  const todayMatches = worldCup.allMatches.filter(
    (m) => isTodayInColombia(m.utcDate) && !m.isFinished
  ).length

  const settled = predictions.filter((p) => p.settledAt)
  const regionHits: Record<string, { hits: number; total: number }> = {}
  for (const p of settled) {
    const region =
      p.homeTeamName.includes('Colombia') ||
      p.awayTeamName.includes('Colombia') ||
      ['Argentina', 'Brasil', 'Chile', 'Uruguay', 'Ecuador', 'Perú', 'Paraguay', 'Venezuela', 'Bolivia'].some(
        (n) => p.homeTeamName.includes(n) || p.awayTeamName.includes(n)
      )
        ? 'sudamericanas'
        : 'otras'
    if (!regionHits[region]) regionHits[region] = { hits: 0, total: 0 }
    regionHits[region].total++
    if ((p.pointsEarned ?? 0) > 0) regionHits[region].hits++
  }

  let bestRegion: string | null = null
  let bestRate = -1
  for (const [region, stats] of Object.entries(regionHits)) {
    if (stats.total < 2) continue
    const rate = stats.hits / stats.total
    if (rate > bestRate) {
      bestRate = rate
      bestRegion = region
    }
  }

  return {
    displayAlias: user.displayAlias,
    rank,
    totalParticipants,
    credits: user.credits,
    totalPoints: myPoints,
    leaderPoints,
    pointsToTop5,
    picksCount: predictions.length,
    settledPicks: settled.length,
    exactHits: myEntry?.exactHits ?? 0,
    todayMatches,
    bestRegion,
    phase: 'group' as const,
  }
}
