/**
 * Migra datos de SQLite local → Neon (PostgreSQL) sin borrar el origen.
 * Incluye polla (usuarios, pronósticos) y catálogo del Mundial si existe.
 *
 * Uso (servidor o local con data/arandano.db del servidor):
 *   npm run migrate:to-neon
 */

import Database from 'better-sqlite3'
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'
import { ensurePostgresSchema } from '../lib/db-schema-postgres'
import { getDatabasePath } from '../lib/db-path'

function sqliteTableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(table) as { name: string } | undefined
  return !!row
}

function sqliteColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return new Set(rows.map((r) => r.name))
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no configurado.')
    console.error('   Agrégalo a .env.local o .env.remote en el servidor.')
    process.exit(1)
  }

  const dbPath = getDatabasePath()
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ No se encontró SQLite: ${dbPath}`)
    process.exit(1)
  }

  const sqlite = new Database(dbPath, { readonly: true })
  const sql = neon(databaseUrl)
  await ensurePostgresSchema(sql)

  console.log(`📤 Origen: ${path.relative(process.cwd(), dbPath)}`)
  console.log(`📥 Destino: Neon (PostgreSQL)\n`)

  if (!sqliteTableExists(sqlite, 'sports_users')) {
    console.log('⚠️  Tabla sports_users no existe en SQLite — nada que migrar de la polla.')
    sqlite.close()
    process.exit(0)
  }

  const userCols = sqliteColumns(sqlite, 'sports_users')
  const users = sqlite
    .prepare(
      `SELECT id, email, name, image, credits,
              ${userCols.has('displayAlias') ? 'displayAlias' : 'NULL AS displayAlias'},
              ${userCols.has('totalPoints') ? 'totalPoints' : '0 AS totalPoints'},
              ${userCols.has('hasPassport') ? 'hasPassport' : '0 AS hasPassport'},
              ${userCols.has('hasKnockoutPassport') ? 'hasKnockoutPassport' : '0 AS hasKnockoutPassport'},
              createdAt, updatedAt
       FROM sports_users`
    )
    .all() as Array<{
      id: string
      email: string
      name: string | null
      image: string | null
      credits: number
      displayAlias: string | null
      totalPoints: number
      hasPassport: number
      hasKnockoutPassport: number
      createdAt: string
      updatedAt: string
    }>

  let predictions: Array<Record<string, unknown>> = []
  if (sqliteTableExists(sqlite, 'match_predictions')) {
    predictions = sqlite
      .prepare(
        `SELECT id, userId, matchId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest,
                matchDate, matchGroup, homeScore, awayScore, creditsWagered,
                actualHomeScore, actualAwayScore, pointsEarned, settledAt, createdAt, updatedAt
         FROM match_predictions`
      )
      .all() as Array<Record<string, unknown>>
  }

  console.log(`   sports_users: ${users.length}`)
  console.log(`   match_predictions: ${predictions.length}`)

  for (const u of users) {
    await sql`
      INSERT INTO sports_users (id, email, name, image, credits, displayalias, totalpoints, haspassport, hasknockoutpassport, createdat, updatedat)
      VALUES (
        ${u.id}, ${u.email}, ${u.name}, ${u.image}, ${u.credits},
        ${u.displayAlias}, ${u.totalPoints}, ${u.hasPassport ?? 0}, ${u.hasKnockoutPassport ?? 0},
        ${u.createdAt}, ${u.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        credits = EXCLUDED.credits,
        displayalias = EXCLUDED.displayalias,
        totalpoints = EXCLUDED.totalpoints,
        haspassport = EXCLUDED.haspassport,
        hasknockoutpassport = EXCLUDED.hasknockoutpassport,
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
        ${p.id as string}, ${p.userId as string}, ${p.matchId as number},
        ${p.homeTeamName as string}, ${p.awayTeamName as string},
        ${p.homeTeamCrest as string | null}, ${p.awayTeamCrest as string | null},
        ${p.matchDate as string}, ${p.matchGroup as string | null},
        ${p.homeScore as number}, ${p.awayScore as number}, ${p.creditsWagered as number},
        ${p.actualHomeScore as number | null}, ${p.actualAwayScore as number | null},
        ${p.pointsEarned as number | null}, ${p.settledAt as string | null},
        ${p.createdAt as string}, ${p.updatedAt as string}
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

  if (sqliteTableExists(sqlite, 'sports_teams')) {
    const teams = sqlite
      .prepare(
        `SELECT id, name, shortName, tla, crest, areaName, areaFlag, coach, founded, clubColors, squadSize, website, syncedAt FROM sports_teams`
      )
      .all() as Array<Record<string, unknown>>
    console.log(`   sports_teams: ${teams.length}`)
    for (const t of teams) {
      await sql`
        INSERT INTO sports_teams (id, name, shortname, tla, crest, areaname, areaflag, coach, founded, clubcolors, squadsize, website, syncedat)
        VALUES (${t.id as number}, ${t.name as string}, ${t.shortName as string}, ${t.tla as string}, ${t.crest as string},
          ${t.areaName as string}, ${t.areaFlag as string | null}, ${t.coach as string | null}, ${t.founded as number | null},
          ${t.clubColors as string | null}, ${t.squadSize as number}, ${t.website as string | null}, ${t.syncedAt as string})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, shortname = EXCLUDED.shortname, syncedat = EXCLUDED.syncedat
      `
    }
  }

  if (sqliteTableExists(sqlite, 'sports_matches')) {
    const matches = sqlite
      .prepare(
        `SELECT id, utcDate, status, matchday, stage, matchGroup, venue, homeTeamId, awayTeamId, scoreJson, syncedAt FROM sports_matches`
      )
      .all() as Array<Record<string, unknown>>
    console.log(`   sports_matches: ${matches.length}`)
    for (const m of matches) {
      await sql`
        INSERT INTO sports_matches (id, utcdate, status, matchday, stage, matchgroup, venue, hometeamid, awayteamid, scorejson, syncedat)
        VALUES (${m.id as number}, ${m.utcDate as string}, ${m.status as string}, ${m.matchday as number | null},
          ${m.stage as string}, ${m.matchGroup as string | null}, ${m.venue as string | null},
          ${m.homeTeamId as number}, ${m.awayTeamId as number}, ${m.scoreJson as string}, ${m.syncedAt as string})
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, scorejson = EXCLUDED.scorejson, syncedat = EXCLUDED.syncedat
      `
    }
  }

  if (sqliteTableExists(sqlite, 'sports_competition')) {
    const comps = sqlite
      .prepare(
        `SELECT id, name, emblem, startDate, endDate, currentMatchday, syncedAt FROM sports_competition`
      )
      .all() as Array<Record<string, unknown>>
    for (const c of comps) {
      await sql`
        INSERT INTO sports_competition (id, name, emblem, startdate, enddate, currentmatchday, syncedat)
        VALUES (${c.id as string}, ${c.name as string}, ${c.emblem as string}, ${c.startDate as string},
          ${c.endDate as string}, ${c.currentMatchday as number | null}, ${c.syncedAt as string})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, syncedat = EXCLUDED.syncedat
      `
    }
  }

  sqlite.close()

  const neonUsers = await sql`SELECT COUNT(*)::int AS n FROM sports_users`
  const neonPreds = await sql`SELECT COUNT(*)::int AS n FROM match_predictions`

  console.log('\n✅ Migración completada')
  console.log(`   Neon sports_users: ${neonUsers[0].n} (SQLite tenía ${users.length})`)
  console.log(`   Neon match_predictions: ${neonPreds[0].n} (SQLite tenía ${predictions.length})`)

  if (Number(neonUsers[0].n) < users.length) {
    console.error('\n❌ Verificación fallida: faltan usuarios en Neon.')
    process.exit(1)
  }

  if (users.length > 0) {
    console.log('\n   Usuarios migrados:')
    for (const u of users) {
      const alias = u.displayAlias ? ` (${u.displayAlias})` : ''
      console.log(`   · ${u.email}${alias}`)
    }
  }

  console.log('\n   Siguiente paso: DB_MODE=postgres en .env.local y reiniciar la app.')
  console.log('   El archivo SQLite NO se borra (queda como respaldo).')
}

main().catch((err) => {
  console.error('❌ Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
