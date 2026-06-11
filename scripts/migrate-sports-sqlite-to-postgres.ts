/**
 * Migra datos de la polla (sports_users, match_predictions) de SQLite local a Neon/PostgreSQL.
 *
 * Uso:
 *   1. Configura DB_MODE=postgres y DATABASE_URL en .env.local
 *   2. npm run init:neon
 *   3. npm run migrate:sports
 */

import Database from 'better-sqlite3'
import { neon } from '@neondatabase/serverless'
import path from 'path'
import { ensurePostgresSchema } from '../lib/db-schema-postgres'
import { getDatabasePath } from '../lib/db-path'

interface SqliteSportsUser {
  id: string
  email: string
  name: string | null
  image: string | null
  credits: number
  displayAlias: string | null
  totalPoints: number
  hasPassport: number
  createdAt: string
  updatedAt: string
}

interface SqlitePrediction {
  id: string
  userId: string
  matchId: number
  homeTeamName: string
  awayTeamName: string
  homeTeamCrest: string | null
  awayTeamCrest: string | null
  matchDate: string
  matchGroup: string | null
  homeScore: number
  awayScore: number
  creditsWagered: number
  actualHomeScore: number | null
  actualAwayScore: number | null
  pointsEarned: number | null
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL no está configurado en .env.local')
    process.exit(1)
  }

  const dbPath = getDatabasePath()
  const sqlite = new Database(dbPath, { readonly: true })

  const users = sqlite
    .prepare(
      `SELECT id, email, name, image, credits, displayAlias, totalPoints, hasPassport, createdAt, updatedAt
       FROM sports_users`
    )
    .all() as SqliteSportsUser[]

  const predictions = sqlite
    .prepare(
      `SELECT id, userId, matchId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest,
              matchDate, matchGroup, homeScore, awayScore, creditsWagered,
              actualHomeScore, actualAwayScore, pointsEarned, settledAt, createdAt, updatedAt
       FROM match_predictions`
    )
    .all() as SqlitePrediction[]

  sqlite.close()

  const sql = neon(databaseUrl)
  await ensurePostgresSchema(sql)

  console.log(`Migrando ${users.length} usuarios y ${predictions.length} pronósticos → Neon`)

  for (const u of users) {
    await sql`
      INSERT INTO sports_users (id, email, name, image, credits, displayalias, totalpoints, haspassport, createdat, updatedat)
      VALUES (
        ${u.id}, ${u.email}, ${u.name}, ${u.image}, ${u.credits},
        ${u.displayAlias}, ${u.totalPoints}, ${u.hasPassport ?? 0}, ${u.createdAt}, ${u.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        credits = EXCLUDED.credits,
        displayalias = EXCLUDED.displayalias,
        totalpoints = EXCLUDED.totalpoints,
        haspassport = EXCLUDED.haspassport,
        updatedat = EXCLUDED.updatedat
    `
  }

  for (const p of predictions) {
    await sql`
      INSERT INTO match_predictions (
        id, userid, matchid, hometeamname, awayteamname, hometeamcrest, awayteamcrest,
        matchdate, matchgroup, homescore, awayscore, creditswagered,
        actualhomescore, actualawayscore, pointsearned, settledat, createdat, updatedat
      )
      VALUES (
        ${p.id}, ${p.userId}, ${p.matchId}, ${p.homeTeamName}, ${p.awayTeamName},
        ${p.homeTeamCrest}, ${p.awayTeamCrest}, ${p.matchDate}, ${p.matchGroup},
        ${p.homeScore}, ${p.awayScore}, ${p.creditsWagered},
        ${p.actualHomeScore}, ${p.actualAwayScore}, ${p.pointsEarned}, ${p.settledAt},
        ${p.createdAt}, ${p.updatedAt}
      )
      ON CONFLICT (userid, matchid) DO UPDATE SET
        hometeamname = EXCLUDED.hometeamname,
        awayteamname = EXCLUDED.awayteamname,
        hometeamcrest = EXCLUDED.hometeamcrest,
        awayteamcrest = EXCLUDED.awayteamcrest,
        matchdate = EXCLUDED.matchdate,
        matchgroup = EXCLUDED.matchgroup,
        homescore = EXCLUDED.homescore,
        awayscore = EXCLUDED.awayscore,
        creditswagered = EXCLUDED.creditswagered,
        actualhomescore = EXCLUDED.actualhomescore,
        actualawayscore = EXCLUDED.actualawayscore,
        pointsearned = EXCLUDED.pointsearned,
        settledat = EXCLUDED.settledat,
        updatedat = EXCLUDED.updatedat
    `
  }

  console.log('✅ Polla migrada a PostgreSQL (Neon)')
  console.log(`   Base SQLite origen: ${path.relative(process.cwd(), dbPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
