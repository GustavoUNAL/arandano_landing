import { getDatabase } from '@/lib/db-sqlite'
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

function ensureDisplayAlias(userId: string): string {
  const db = getDatabase()
  const user = db.prepare('SELECT displayAlias FROM sports_users WHERE id = ?').get(userId) as
    | { displayAlias: string | null }
    | undefined

  if (user?.displayAlias) return user.displayAlias

  const alias = generateDisplayAlias(userId)
  const now = new Date().toISOString()
  db.prepare('UPDATE sports_users SET displayAlias = ?, updatedAt = ? WHERE id = ?').run(
    alias,
    now,
    userId
  )
  return alias
}

function recalculateAllTotalPoints(now: string) {
  const db = getDatabase()
  db.prepare(
    `UPDATE sports_users
     SET totalPoints = (
       SELECT COALESCE(SUM(pointsEarned), 0)
       FROM match_predictions mp
       WHERE mp.userId = sports_users.id AND mp.settledAt IS NOT NULL
     ),
     updatedAt = ?`
  ).run(now)
}

export function settleFinishedMatches(
  finishedMatches: Array<{
    id: number
    status: string
    score: { fullTime: { home: number | null; away: number | null } }
  }>
): number {
  const db = getDatabase()
  let settled = 0
  const now = new Date().toISOString()

  const getByMatch = db.prepare('SELECT * FROM match_predictions WHERE matchId = ?')
  const updatePred = db.prepare(
    `UPDATE match_predictions
     SET actualHomeScore = ?, actualAwayScore = ?, pointsEarned = ?,
         settledAt = COALESCE(settledAt, ?), updatedAt = ?
     WHERE id = ?`
  )

  const txn = db.transaction(() => {
    for (const match of finishedMatches) {
      if (match.status !== 'FINISHED') continue
      const home = match.score.fullTime.home
      const away = match.score.fullTime.away
      if (home == null || away == null) continue

      const preds = getByMatch.all(match.id) as MatchPrediction[]
      for (const p of preds) {
        const points = calculatePredictionPoints(p.homeScore, p.awayScore, home, away)
        const wasUnsettled = !p.settledAt
        updatePred.run(home, away, points, now, now, p.id)
        if (wasUnsettled) settled++
      }
    }
    recalculateAllTotalPoints(now)
  })
  txn()

  return settled
}

export function getLeaderboard(currentUserId?: string): LeaderboardEntry[] {
  const db = getDatabase()
  const rows = db
    .prepare(
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
      GROUP BY su.id
      ORDER BY
        su.totalPoints DESC,
        exactHits DESC,
        goalDiffHits DESC,
        resultHits DESC,
        settledCount DESC,
        su.displayAlias ASC
      LIMIT 50`
    )
    .all(POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE, POINTS_CORRECT_RESULT) as Array<{
    id: string
    displayAlias: string | null
    totalPoints: number
    picksCount: number
    settledCount: number
    exactHits: number
    goalDiffHits: number
    resultHits: number
  }>

  const base = rows.map((row, index) => {
    const settledCount = row.settledCount
    return {
      rank: index + 1,
      displayAlias: row.displayAlias ?? generateDisplayAlias(row.id),
      totalPoints: row.totalPoints ?? 0,
      picksCount: row.picksCount,
      settledCount,
      exactHits: row.exactHits,
      goalDiffHits: row.goalDiffHits,
      resultHits: row.resultHits,
      qualifiesForPodium: settledCount >= MIN_SETTLED_PICKS_TO_WIN,
      isWinner: false,
      winnerRank: null as number | null,
      isCurrentUser: row.id === currentUserId,
    }
  })

  return applyWinnerRanks(base)
}

export function getOrCreateSportsUser(input: {
  id: string
  email: string
  name?: string | null
  image?: string | null
}): SportsUser {
  const db = getDatabase()
  const existing = db
    .prepare('SELECT * FROM sports_users WHERE id = ?')
    .get(input.id) as SportsUser | undefined

  if (existing) {
    const now = new Date().toISOString()
    const alias = existing.displayAlias ?? generateDisplayAlias(input.id)
    db.prepare(
      `UPDATE sports_users SET name = ?, image = ?, email = ?, displayAlias = COALESCE(displayAlias, ?), updatedAt = ? WHERE id = ?`
    ).run(input.name ?? existing.name, input.image ?? existing.image, input.email, alias, now, input.id)
    return db.prepare('SELECT * FROM sports_users WHERE id = ?').get(input.id) as SportsUser
  }

  const now = new Date().toISOString()
  const alias = generateDisplayAlias(input.id)
  db.prepare(
    `INSERT INTO sports_users (id, email, name, image, credits, displayAlias, totalPoints, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    input.id,
    input.email,
    input.name ?? null,
    input.image ?? null,
    INITIAL_CREDITS,
    alias,
    now,
    now
  )

  return db.prepare('SELECT * FROM sports_users WHERE id = ?').get(input.id) as SportsUser
}

export function getUserPredictions(userId: string): MatchPrediction[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM match_predictions WHERE userId = ? ORDER BY matchDate ASC')
    .all(userId) as MatchPrediction[]
}

export function getPrediction(userId: string, matchId: number): MatchPrediction | null {
  const db = getDatabase()
  return (
    (db
      .prepare('SELECT * FROM match_predictions WHERE userId = ? AND matchId = ?')
      .get(userId, matchId) as MatchPrediction | undefined) ?? null
  )
}

export function savePrediction(input: {
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
}): { user: SportsUser; prediction: MatchPrediction } {
  const db = getDatabase()

  if (!isMatchPredictable(input.matchStatus, input.matchDate)) {
    throw new Error('El partido ya comenzó. No puedes pronosticar.')
  }

  if (input.homeScore < 0 || input.awayScore < 0 || input.homeScore > 20 || input.awayScore > 20) {
    throw new Error('Marcador inválido.')
  }

  ensureDisplayAlias(input.userId)

  const existing = getPrediction(input.userId, input.matchId)
  const now = new Date().toISOString()

  if (existing) {
    if (existing.settledAt) {
      throw new Error('Este pronóstico ya fue calificado. No puedes editarlo.')
    }

    db.prepare(
      `UPDATE match_predictions
       SET homeScore = ?, awayScore = ?, updatedAt = ?
       WHERE id = ?`
    ).run(input.homeScore, input.awayScore, now, existing.id)

    const user = db.prepare('SELECT * FROM sports_users WHERE id = ?').get(input.userId) as SportsUser
    const prediction = db
      .prepare('SELECT * FROM match_predictions WHERE id = ?')
      .get(existing.id) as MatchPrediction
    return { user, prediction }
  }

  const user = db.prepare('SELECT * FROM sports_users WHERE id = ?').get(input.userId) as SportsUser
  if (!user) throw new Error('Usuario no encontrado')
  if (user.credits < PREDICTION_COST) {
    throw new Error(`Necesitas al menos ${PREDICTION_COST} créditos para pronosticar.`)
  }

  const id = randomUUID()
  const txn = db.transaction(() => {
    db.prepare(`UPDATE sports_users SET credits = credits - ?, updatedAt = ? WHERE id = ?`).run(
      PREDICTION_COST,
      now,
      input.userId
    )
    db.prepare(
      `INSERT INTO match_predictions (
        id, userId, matchId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest,
        matchDate, matchGroup, homeScore, awayScore, creditsWagered,
        actualHomeScore, actualAwayScore, pointsEarned, settledAt,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`
    ).run(
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
      now
    )
  })
  txn()

  return {
    user: db.prepare('SELECT * FROM sports_users WHERE id = ?').get(input.userId) as SportsUser,
    prediction: db.prepare('SELECT * FROM match_predictions WHERE id = ?').get(id) as MatchPrediction,
  }
}
