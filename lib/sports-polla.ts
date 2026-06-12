import { dbAll, dbGet, dbRun, dbTransaction } from '@/lib/db'
import {
  applyWinnerRanks,
  calculatePredictionPoints,
  INITIAL_CREDITS,
  isMatchPredictable,
  type AdminSportsUserRow,
  type LeaderboardEntry,
  MAX_SCORE_PER_TEAM,
  type MatchPickDistribution,
  type MatchPrediction,
  type MatchPredictionStats,
  MIN_SETTLED_PICKS_TO_WIN,
  type PublicMatchPick,
  normalizeHasKnockoutPassport,
  normalizeHasPassport,
  PREDICTION_COST,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  type SportsUser,
} from '@/lib/sports-polla-shared'
import {
  computeCreditsBalance,
  GROUP_STAGE_WINNERS_COUNT,
  TOP_WINNERS_COUNT,
  type PollaPhase,
} from '@/lib/polla-rules'
import { randomUUID } from 'crypto'

export {
  applyWinnerRanks,
  calculatePredictionPoints,
  INITIAL_CREDITS,
  isMatchPredictable,
  type LeaderboardEntry,
  type MatchPickDistribution,
  type MatchPrediction,
  type MatchPredictionStats,
  MIN_SETTLED_PICKS_TO_WIN,
  type PublicMatchPick,
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

function mapSportsUser(
  row: SportsUser & { hasPassport?: unknown; hasKnockoutPassport?: unknown }
): SportsUser {
  return {
    ...row,
    lastCreditsRechargeDate: row.lastCreditsRechargeDate ?? null,
    hasPassport: normalizeHasPassport(row.hasPassport),
    hasKnockoutPassport: normalizeHasKnockoutPassport(row.hasKnockoutPassport),
  }
}

export function generateDisplayAlias(userId: string): string {
  const h = hashUserId(userId)
  const animal = ANIMALS[h % ANIMALS.length]
  const num = (h % 900) + 100
  return `${animal} ${num}`
}

const DISPLAY_ALIAS_MIN = 3
const DISPLAY_ALIAS_MAX = 24
const DISPLAY_ALIAS_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9][a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s._-]*$/

export function validateDisplayAlias(displayAlias: string): string {
  const normalized = displayAlias.trim().replace(/\s+/g, ' ')
  if (normalized.length < DISPLAY_ALIAS_MIN) {
    throw new Error(`El nombre debe tener al menos ${DISPLAY_ALIAS_MIN} caracteres.`)
  }
  if (normalized.length > DISPLAY_ALIAS_MAX) {
    throw new Error(`El nombre no puede superar ${DISPLAY_ALIAS_MAX} caracteres.`)
  }
  if (!DISPLAY_ALIAS_PATTERN.test(normalized)) {
    throw new Error('Usa solo letras, números, espacios, puntos, guiones o guiones bajos.')
  }
  return normalized
}

/** Alinea el saldo con el reglamento: 7.200 iniciales − créditos ya apostados. */
export async function syncCreditsOnLogin(userId: string): Promise<void> {
  const user = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [userId])
  if (!user) return

  const agg = await dbGet<{ wagered: number }>(
    `SELECT COALESCE(SUM(creditsWagered), 0) AS wagered
     FROM match_predictions WHERE userId = ?`,
    [userId]
  )
  const wagered = Number(agg?.wagered ?? 0)
  const expected = computeCreditsBalance(wagered)
  const now = new Date().toISOString()

  if (user.credits !== expected) {
    await dbRun('UPDATE sports_users SET credits = ?, updatedAt = ? WHERE id = ?', [
      expected,
      now,
      userId,
    ])
  }
}

/** @deprecated Usar syncCreditsOnLogin */
export async function syncWelcomeCreditsIfNeeded(userId: string): Promise<void> {
  await syncCreditsOnLogin(userId)
}

export async function updateDisplayAlias(userId: string, displayAlias: string): Promise<SportsUser> {
  const normalized = validateDisplayAlias(displayAlias)
  const taken = await dbGet<{ id: string }>(
    'SELECT id FROM sports_users WHERE LOWER(displayAlias) = LOWER(?) AND id != ?',
    [normalized, userId]
  )
  if (taken) {
    throw new Error('Ese nombre de usuario ya está en uso.')
  }

  const now = new Date().toISOString()
  await dbRun('UPDATE sports_users SET displayAlias = ?, updatedAt = ? WHERE id = ?', [
    normalized,
    now,
    userId,
  ])
  return mapSportsUser((await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [userId]))!)
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

export async function getLeaderboard(
  currentUserId?: string,
  phase: PollaPhase = 'group'
): Promise<LeaderboardEntry[]> {
  const isGroup = phase === 'group'
  const passportFilter = isGroup ? '' : 'AND su.hasKnockoutPassport = 1'
  const matchFilter = isGroup ? 'AND mp.matchGroup IS NOT NULL' : 'AND mp.matchGroup IS NULL'

  const rows = await dbAll<{
    id: string
    displayAlias: string | null
    hasPassport: number | boolean
    hasKnockoutPassport: number | boolean
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
      su.hasPassport,
      su.hasKnockoutPassport,
      COALESCE(SUM(CASE WHEN mp.settledAt IS NOT NULL THEN mp.pointsEarned ELSE 0 END), 0) AS totalPoints,
      COUNT(mp.id) AS picksCount,
      SUM(CASE WHEN mp.settledAt IS NOT NULL THEN 1 ELSE 0 END) AS settledCount,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS exactHits,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS goalDiffHits,
      SUM(CASE WHEN mp.pointsEarned = ? THEN 1 ELSE 0 END) AS resultHits
    FROM sports_users su
    INNER JOIN match_predictions mp ON mp.userId = su.id
    WHERE 1=1 ${passportFilter} ${matchFilter}
    GROUP BY su.id, su.displayAlias, su.hasPassport, su.hasKnockoutPassport
    ORDER BY
      totalPoints DESC,
      exactHits DESC,
      goalDiffHits DESC,
      resultHits DESC,
      settledCount DESC,
      su.displayAlias ASC
    LIMIT 50`,
    [POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE, POINTS_CORRECT_RESULT]
  )

  const maxWinners = isGroup ? GROUP_STAGE_WINNERS_COUNT : TOP_WINNERS_COUNT

  const base = rows.map((row, index) => {
    const settledCount = Number(row.settledCount)
    const hasPassport = normalizeHasPassport(row.hasPassport)
    const hasKnockoutPassport = normalizeHasKnockoutPassport(row.hasKnockoutPassport)
    const qualifiesForPodium = isGroup
      ? settledCount >= MIN_SETTLED_PICKS_TO_WIN
      : hasKnockoutPassport && settledCount >= MIN_SETTLED_PICKS_TO_WIN
    return {
      rank: index + 1,
      displayAlias: row.displayAlias ?? generateDisplayAlias(row.id),
      totalPoints: row.totalPoints ?? 0,
      picksCount: Number(row.picksCount),
      settledCount,
      exactHits: Number(row.exactHits),
      goalDiffHits: Number(row.goalDiffHits),
      resultHits: Number(row.resultHits),
      hasPassport,
      hasKnockoutPassport,
      phase,
      qualifiesForPodium,
      isWinner: false,
      winnerRank: null as number | null,
      isCurrentUser: row.id === currentUserId,
    }
  })

  return applyWinnerRanks(base, maxWinners)
}

export async function getOrCreateSportsUser(input: {
  id: string
  email: string
  name?: string | null
  image?: string | null
}): Promise<SportsUser> {
  let existing =
    (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.id])) ??
    (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE LOWER(email) = LOWER(?)', [input.email]))

  if (existing) {
    const now = new Date().toISOString()
    const alias = existing.displayAlias ?? generateDisplayAlias(existing.id)
    await dbRun(
      `UPDATE sports_users SET name = ?, image = ?, email = ?, displayAlias = COALESCE(displayAlias, ?), updatedAt = ? WHERE id = ?`,
      [input.name ?? existing.name, input.image ?? existing.image, input.email, alias, now, existing.id]
    )
    await syncCreditsOnLogin(existing.id)
    return mapSportsUser((await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [existing.id]))!)
  }

  const now = new Date().toISOString()
  const alias = generateDisplayAlias(input.id)
  await dbRun(
    `INSERT INTO sports_users (id, email, name, image, credits, displayAlias, totalPoints, hasPassport, hasKnockoutPassport, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
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

  return mapSportsUser((await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.id]))!)
}

export async function listAllSportsUsersForAdmin(): Promise<AdminSportsUserRow[]> {
  const rows = await dbAll<{
    id: string
    email: string
    name: string | null
    image: string | null
    credits: number
    displayAlias: string | null
    totalPoints: number
    hasPassport: number | boolean
    hasKnockoutPassport: number | boolean
    lastCreditsRechargeDate: string | null
    createdAt: string
    updatedAt: string
    picksCount: number
    settledCount: number
  }>(
    `SELECT
      su.id,
      su.email,
      su.name,
      su.image,
      su.credits,
      su.displayAlias,
      su.totalPoints,
      su.hasPassport,
      su.hasKnockoutPassport,
      su.lastCreditsRechargeDate,
      su.createdAt,
      su.updatedAt,
      COUNT(mp.id) AS picksCount,
      SUM(CASE WHEN mp.settledAt IS NOT NULL THEN 1 ELSE 0 END) AS settledCount
    FROM sports_users su
    LEFT JOIN match_predictions mp ON mp.userId = su.id
    GROUP BY su.id
    ORDER BY su.hasPassport DESC, su.totalPoints DESC, su.createdAt DESC`
  )

  return rows.map((row) => ({
    ...mapSportsUser(row as SportsUser & { hasPassport?: unknown }),
    picksCount: Number(row.picksCount),
    settledCount: Number(row.settledCount ?? 0),
  }))
}

export async function setUserPassport(userId: string, hasPassport: boolean): Promise<SportsUser> {
  const now = new Date().toISOString()
  const result = await dbRun('UPDATE sports_users SET hasPassport = ?, updatedAt = ? WHERE id = ?', [
    hasPassport ? 1 : 0,
    now,
    userId,
  ])
  if (result.changes === 0) throw new Error('Usuario no encontrado')
  const user = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [userId])
  if (!user) throw new Error('Usuario no encontrado')
  return mapSportsUser(user)
}

export async function setUserKnockoutPassport(
  userId: string,
  hasKnockoutPassport: boolean
): Promise<SportsUser> {
  const now = new Date().toISOString()
  const result = await dbRun(
    'UPDATE sports_users SET hasKnockoutPassport = ?, updatedAt = ? WHERE id = ?',
    [hasKnockoutPassport ? 1 : 0, now, userId]
  )
  if (result.changes === 0) throw new Error('Usuario no encontrado')
  const user = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [userId])
  if (!user) throw new Error('Usuario no encontrado')
  return mapSportsUser(user)
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
}): Promise<{ user: SportsUser; prediction: MatchPrediction; creditsCharged: number }> {
  if (!isMatchPredictable(input.matchStatus, input.matchDate)) {
    throw new Error('El partido ya comenzó. No puedes pronosticar.')
  }

  if (
    input.homeScore < 0 ||
    input.awayScore < 0 ||
    input.homeScore > MAX_SCORE_PER_TEAM ||
    input.awayScore > MAX_SCORE_PER_TEAM
  ) {
    throw new Error(`Marcador inválido (0 a ${MAX_SCORE_PER_TEAM} goles por equipo).`)
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
    return { user: mapSportsUser(user), prediction, creditsCharged: 0 }
  }

  const user = await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.userId])
  if (!user) throw new Error('Usuario no encontrado')
  const mappedUser = mapSportsUser(user)
  if (mappedUser.credits < PREDICTION_COST) {
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
    user: mapSportsUser(
      (await dbGet<SportsUser>('SELECT * FROM sports_users WHERE id = ?', [input.userId]))!
    ),
    prediction: (await dbGet<MatchPrediction>('SELECT * FROM match_predictions WHERE id = ?', [id]))!,
    creditsCharged: PREDICTION_COST,
  }
}

export async function getMatchPredictionStats(
  matchId: number,
  currentUserId?: string
): Promise<{ stats: MatchPredictionStats; picks: PublicMatchPick[] }> {
  const rows = await dbAll<{
    homeScore: number
    awayScore: number
    count: number
    displayAlias: string | null
    userId: string
  }>(
    `SELECT
      mp.homeScore,
      mp.awayScore,
      su.displayAlias,
      su.id AS userId,
      1 AS count
    FROM match_predictions mp
    INNER JOIN sports_users su ON su.id = mp.userId
    WHERE mp.matchId = ?
    ORDER BY mp.createdAt ASC`,
    [matchId]
  )

  const picks: PublicMatchPick[] = rows.map((row) => ({
    displayAlias: row.displayAlias ?? 'Jugador',
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    isCurrentUser: row.userId === currentUserId,
  }))

  const countMap = new Map<string, { homeScore: number; awayScore: number; count: number }>()
  for (const row of rows) {
    const key = `${row.homeScore}-${row.awayScore}`
    const existing = countMap.get(key)
    if (existing) {
      existing.count += 1
    } else {
      countMap.set(key, { homeScore: row.homeScore, awayScore: row.awayScore, count: 1 })
    }
  }

  const totalPicks = rows.length
  const distribution: MatchPickDistribution[] = [...countMap.values()]
    .map((item) => ({
      ...item,
      percentage: totalPicks > 0 ? Math.round((item.count / totalPicks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  let homeWins = 0
  let draws = 0
  let awayWins = 0
  let sumHome = 0
  let sumAway = 0

  for (const row of rows) {
    sumHome += row.homeScore
    sumAway += row.awayScore
    if (row.homeScore > row.awayScore) homeWins++
    else if (row.homeScore < row.awayScore) awayWins++
    else draws++
  }

  const stats: MatchPredictionStats = {
    totalPicks,
    distribution,
    homeWinPct: totalPicks > 0 ? Math.round((homeWins / totalPicks) * 100) : 0,
    drawPct: totalPicks > 0 ? Math.round((draws / totalPicks) * 100) : 0,
    awayWinPct: totalPicks > 0 ? Math.round((awayWins / totalPicks) * 100) : 0,
    avgHomeGoals: totalPicks > 0 ? Math.round((sumHome / totalPicks) * 10) / 10 : 0,
    avgAwayGoals: totalPicks > 0 ? Math.round((sumAway / totalPicks) * 10) / 10 : 0,
  }

  return { stats, picks }
}
