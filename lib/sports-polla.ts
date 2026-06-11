import { dbAll, dbGet, dbRun, dbTransaction } from '@/lib/db'
import {
  applyWinnerRanks,
  calculatePredictionPoints,
  INITIAL_CREDITS,
  isMatchPredictable,
  type LeaderboardEntry,
  type MatchPrediction,
  MIN_SETTLED_PICKS_TO_WIN,
  PREDICTION_COST,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  type SportsUser,
} from '@/lib/sports-polla-shared'
import { randomUUID } from 'crypto'

export {
  applyWinnerRanks,
  calculatePredictionPoints,
  INITIAL_CREDITS,
  isMatchPredictable,
  type LeaderboardEntry,
  type MatchPrediction,
  MIN_SETTLED_PICKS_TO_WIN,
  PREDICTION_COST,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  TOP_WINNERS_COUNT,
  type SportsUser,
} from '@/lib/sports-polla-shared'

export { getScoringRules, REGLAMENTO_SHORT, type ScoringRules } from '@/lib/polla-rules'

const ANIMALS = [
  'Jaguar',
  'Águila',
  'Lobo',
  'Tigre',
  'Puma',
  'Zorro',
  'Búho',
  'Cóndor',
  'Delfín',
  'Oso',
  'Halcón',
  'Pantera',
  'Toro',
  'Lince',
  'Ballena',
  'Koala',
  'Mapache',
  'Pingüino',
  'Llama',
  'Cebra',
  'Ciervo',
  'Serpiente',
  'Tortuga',
  'Rana',
]

function hashUserId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h
}

export function generateDisplayAlias(userId: string): string {
  const h = hashUserId(userId)
  const animal = ANIMALS[h % ANIMALS.length]
  const num = (h % 900) + 100
  return `${animal} ${num}`
}

async function ensureDisplayAlias(userId: string): Promise<string> {
  const user = await dbGet<{ displayAlias: string | null }>(
    'SELECT displayAlias FROM sports_users WHERE id = ?',
    [userId]
  )

  if (user?.displayAlias) return user.displayAlias

  const alias = generateDisplayAlias(userId)
  const now = new Date().toISOString()
  await dbRun('UPDATE sports_users SET displayAlias = ?, updatedAt = ? WHERE id = ?', [
    alias,
    now,
    userId,
  ])
  return alias
}

export async function settleFinishedMatches(
  finishedMatches: Array<{
    id: number
    status: string
    score: { fullTime: { home: number | null; away: number | null } }
  }>
): Promise<number> {
  let settled = 0
  const now = new Date().toISOString()

  await dbTransaction(async (tx) => {
    for (const match of finishedMatches) {
      if (match.status !== 'FINISHED') continue
      const home = match.score.fullTime.home
      const away = match.score.fullTime.away
      if (home == null || away == null) continue

      const preds = await tx.all<MatchPrediction>(
        'SELECT * FROM match_predictions WHERE matchId = ?',
        [match.id]
      )
      for (const p of preds) {
        const points = calculatePredictionPoints(p.homeScore, p.awayScore, home, away)
        const wasUnsettled = !p.settledAt
        await tx.run(
          `UPDATE match_predictions
           SET actualHomeScore = ?, actualAwayScore = ?, pointsEarned = ?,
               settledAt = COALESCE(settledAt, ?), updatedAt = ?
           WHERE id = ?`,
          [home, away, points, now, now, p.id]
        )
        if (wasUnsettled) settled++
      }
    }
    await tx.run(
      `UPDATE sports_users
       SET totalPoints = (
         SELECT COALESCE(SUM(pointsEarned), 0)
         FROM match_predictions mp
         WHERE mp.userId = sports_users.id AND mp.settledAt IS NOT NULL
       ),
       updatedAt = ?`,
      [now]
    )
  })

  return settled
}

export async function getLeaderboard(currentUserId?: string): Promise<LeaderboardEntry[]> {
  const rows = await dbAll<{
    id: string
    displayAlias: string | null
    totalPoints: number
    picksCount: number
    settledCount: number
    exactHits: number
    goalDiffHits: number
    resultHits: number
  }>(
    `SELECT
      su.id,
      su.displayAlias,
      su.totalPoints,
      COUNT(mp.id) AS picksCount,
      SUM(CASE WHEN mp.settledAt IS NOT NULL THEN 1 ELSE 0 END) AS settledCount,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS exactHits,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS goalDiffHits,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS resultHits
    FROM sports_users su
    INNER JOIN match_predictions mp ON mp.userId = su.id
    GROUP BY su.id, su.displayAlias, su.totalPoints
    ORDER BY
      su.totalPoints DESC,
      exactHits DESC,
      goalDiffHits DESC,
      resultHits DESC,
      settledCount DESC,
      su.displayAlias ASC
    LIMIT 50`,
    [POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE, POINTS_CORRECT_RESULT]
  )

  const base = rows.map((row, index) => {
    const settledCount = Number(row.settledCount)
    return {
      rank: index + 1,
      displayAlias: row.displayAlias ?? generateDisplayAlias(row.id),
      totalPoints: row.totalPoints ?? 0,
      picksCount: Number(row.picksCount),
      settledCount,
      exactHits: Number(row.exactHits),
      goalDiffHits: Number(row.goalDiffHits),
      resultHits: Number(row.resultHits),
      qualifiesForPodium: settledCount >= MIN_SETTLED_PICKS_TO_WIN,
      isWinner: false,
      winnerRank: null as number | null,
      isCurrentUser: row.id === currentUserId,
    }
  })

  return applyWinnerRanks(base)
}

export async function getOrCreateSportsUser(input: {
  id: string
  email: string
  name?: string | null
  image?: string | null
}): Promise<SportsUser> {
  const existing = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.id])

  if (existing) {
    const now = new Date().toISOString()
    const alias = existing.displayAlias ?? generateDisplayAlias(input.id)
    await dbRun(
      `UPDATE sports_users SET name = ?, image = ?, email = ?, displayAlias = COALESCE(displayAlias, ?), updatedAt = ? WHERE id = ?`,
      [input.name ?? existing.name, input.image ?? existing.image, input.email, alias, now, input.id]
    )
    return (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.id]))!
  }

  const now = new Date().toISOString()
  const alias = generateDisplayAlias(input.id)
  await dbRun(
    `INSERT INTO sports_users (id, email, name, image, credits, displayAlias, totalPoints, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      input.id,
      input.email,
      input.name ?? null,
      input.image ?? null,
      INITIAL_CREDITS,
      alias,
      now,
      now,
    ]
  )

  return (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.id]))!
}

export async function getUserPredictions(userId: string): Promise<MatchPrediction[]> {
  return dbAll<MatchPrediction>(
    'SELECT * FROM match_predictions WHERE userId = ? ORDER BY matchDate ASC',
    [userId]
  )
}

export async function getPrediction(
  userId: string,
  matchId: number
): Promise<MatchPrediction | null> {
  return (
    (await dbGet<MatchPrediction>(
      'SELECT * FROM match_predictions WHERE userId = ? AND matchId = ?',
      [userId, matchId]
    )) ?? null
  )
}

export async function savePrediction(input: {
  userId: string
  matchId: number
  homeTeamName: string
  awayTeamName: string
  homeTeamCrest?: string
  awayTeamCrest?: string
  matchDate: string
  matchStatus: string
  matchGroup?: string | null
  homeScore: number
  awayScore: number
}): Promise<{ user: SportsUser; prediction: MatchPrediction }> {
  if (!isMatchPredictable(input.matchStatus, input.matchDate)) {
    throw new Error('El partido ya comenzó. No puedes pronosticar.')
  }

  if (input.homeScore < 0 || input.awayScore < 0 || input.homeScore > 20 || input.awayScore > 20) {
    throw new Error('Marcador inválido.')
  }

  await ensureDisplayAlias(input.userId)

  const existing = await getPrediction(input.userId, input.matchId)
  const now = new Date().toISOString()

  if (existing) {
    if (existing.settledAt) {
      throw new Error('Este pronóstico ya fue calificado. No puedes editarlo.')
    }

    await dbRun(
      `UPDATE match_predictions
       SET homeScore = ?, awayScore = ?, updatedAt = ?
       WHERE id = ?`,
      [input.homeScore, input.awayScore, now, existing.id]
    )

    const user = (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [
      input.userId,
    ]))!
    const prediction = (await dbGet<MatchPrediction>('SELECT * FROM match_predictions WHERE id = ?', [
      existing.id,
    ]))!
    return { user, prediction }
  }

  const user = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.userId])
  if (!user) throw new Error('Usuario no encontrado')
  if (user.credits < PREDICTION_COST) {
    throw new Error(`Necesitas al menos ${PREDICTION_COST} créditos para pronosticar.`)
  }

  const id = randomUUID()
  await dbTransaction(async (tx) => {
    await tx.run(`UPDATE sports_users SET credits = credits - ?, updatedAt = ? WHERE id = ?`, [
      PREDICTION_COST,
      now,
      input.userId,
    ])
    await tx.run(
      `INSERT INTO match_predictions (
        id, userId, matchId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest,
        matchDate, matchGroup, homeScore, awayScore, creditsWagered,
        actualHomeScore, actualAwayScore, pointsEarned, settledAt,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`,
      [
        id,
        input.userId,
        input.matchId,
        input.homeTeamName,
        input.awayTeamName,
        input.homeTeamCrest ?? null,
        input.awayTeamCrest ?? null,
        input.matchDate,
        input.matchGroup ?? null,
        input.homeScore,
        input.awayScore,
        PREDICTION_COST,
        now,
        now,
      ]
    )
  })

  return {
    user: (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.userId]))!,
    prediction: (await dbGet<MatchPrediction>('SELECT * FROM match_predictions WHERE id = ?', [id]))!,
  }
}
