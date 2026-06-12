/**
 * Copia datos desde Neon/PostgreSQL → SQLite local.
 *
 * Requiere DATABASE_URL (misma que en el servidor):
 *   - en .env.local, o
 *   - en .env.remote (gitignored), o
 *   - DATABASE_URL=... npm run pull:remote-db
 *
 * Uso:
 *   npm run pull:remote-db              # todo (usuarios + picks + catálogo)
 *   npm run pull:remote-users           # solo usuarios y pronósticos
 */

import { neon } from '@neondatabase/serverless'
import { getDatabase } from '../lib/db-sqlite'
import { getDatabasePath } from '../lib/db-path'

const usersOnly = process.argv.includes('--users-only')

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('❌ Falta DATABASE_URL.')
    console.error('')
    console.error('   Cópiala del servidor (misma URL de Neon):')
    console.error('   ssh tu-usuario@servidor "grep DATABASE_URL ~/arandano/.env.local"')
    console.error('')
    console.error('   Luego agrégala a .env.local o crea .env.remote:')
    console.error('   DATABASE_URL=postgresql://...@.../neondb?sslmode=require')
    console.error('')
    console.error('   O en una sola línea:')
    console.error('   DATABASE_URL="postgresql://..." npm run pull:remote-users')
    process.exit(1)
  }
  return url
}

async function main() {
  const databaseUrl = requireDatabaseUrl()
  const dbPath = getDatabasePath()
  const pg = neon(databaseUrl)
  const sqlite = getDatabase()

  console.log(`📥 Descargando desde Neon → ${dbPath}`)
  console.log(usersOnly ? '   Modo: usuarios + pronósticos\n' : '   Modo: completo\n')

  const users = await pg`
    SELECT id, email, name, image, credits, displayalias, totalpoints,
           haspassport, hasknockoutpassport, createdat, updatedat
    FROM sports_users
  `
  console.log(`   sports_users: ${users.length}`)

  const predictions = await pg`
    SELECT id, userid, matchid, hometeamname, awayteamname, hometeamcrest, awayteamcrest,
           matchdate, matchgroup, homescore, awayscore, creditswagered,
           actualhomescore, actualawayscore, pointsearned, settledat, createdat, updatedat
    FROM match_predictions
  `
  console.log(`   match_predictions: ${predictions.length}`)

  let teams: Record<string, unknown>[] = []
  let matches: Record<string, unknown>[] = []
  let competition: Record<string, unknown>[] = []

  if (!usersOnly) {
    try {
      teams = await pg`
        SELECT id, name, shortname, tla, crest, areaname, areaflag, coach, founded,
               clubcolors, squadsize, website, syncedat
        FROM sports_teams
      `
      console.log(`   sports_teams: ${teams.length}`)
    } catch {
      console.log('   sports_teams: (tabla no existe en remoto — omitida)')
    }

    try {
      matches = await pg`
        SELECT id, utcdate, status, matchday, stage, matchgroup, venue,
               hometeamid, awayteamid, scorejson, syncedat
        FROM sports_matches
      `
      console.log(`   sports_matches: ${matches.length}`)
    } catch {
      console.log('   sports_matches: (tabla no existe en remoto — omitida)')
    }

    try {
      competition = await pg`
        SELECT id, name, emblem, startdate, enddate, currentmatchday, syncedat
        FROM sports_competition
      `
      console.log(`   sports_competition: ${competition.length}`)
    } catch {
      console.log('   sports_competition: (tabla no existe en remoto — omitida)')
    }
  }

  const run = sqlite.transaction(() => {
    sqlite.prepare('DELETE FROM match_predictions').run()
    sqlite.prepare('DELETE FROM sports_users').run()

    const insertUser = sqlite.prepare(`
      INSERT INTO sports_users (id, email, name, image, credits, displayAlias, totalPoints,
        hasPassport, hasKnockoutPassport, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const u of users) {
      insertUser.run(
        u.id,
        u.email,
        u.name,
        u.image,
        u.credits,
        u.displayalias,
        u.totalpoints,
        u.haspassport ?? 0,
        u.hasknockoutpassport ?? 0,
        u.createdat,
        u.updatedat
      )
    }

    const insertPred = sqlite.prepare(`
      INSERT INTO match_predictions (id, userId, matchId, homeTeamName, awayTeamName,
        homeTeamCrest, awayTeamCrest, matchDate, matchGroup, homeScore, awayScore,
        creditsWagered, actualHomeScore, actualAwayScore, pointsEarned, settledAt,
        createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const p of predictions) {
      insertPred.run(
        p.id,
        p.userid,
        p.matchid,
        p.hometeamname,
        p.awayteamname,
        p.hometeamcrest,
        p.awayteamcrest,
        p.matchdate,
        p.matchgroup,
        p.homescore,
        p.awayscore,
        p.creditswagered,
        p.actualhomescore,
        p.actualawayscore,
        p.pointsearned,
        p.settledat,
        p.createdat,
        p.updatedat
      )
    }

    if (teams.length > 0) {
      sqlite.prepare('DELETE FROM sports_matches').run()
      sqlite.prepare('DELETE FROM sports_teams').run()
      const insertTeam = sqlite.prepare(`
        INSERT INTO sports_teams (id, name, shortName, tla, crest, areaName, areaFlag, coach,
          founded, clubColors, squadSize, website, syncedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const t of teams) {
        insertTeam.run(
          t.id,
          t.name,
          t.shortname,
          t.tla,
          t.crest,
          t.areaname,
          t.areaflag,
          t.coach,
          t.founded,
          t.clubcolors,
          t.squadsize,
          t.website,
          t.syncedat
        )
      }
    }

    if (matches.length > 0) {
      const insertMatch = sqlite.prepare(`
        INSERT INTO sports_matches (id, utcDate, status, matchday, stage, matchGroup, venue,
          homeTeamId, awayTeamId, scoreJson, syncedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const m of matches) {
        insertMatch.run(
          m.id,
          m.utcdate,
          m.status,
          m.matchday,
          m.stage,
          m.matchgroup,
          m.venue,
          m.hometeamid,
          m.awayteamid,
          m.scorejson,
          m.syncedat
        )
      }
    }

    if (competition.length > 0) {
      sqlite.prepare('DELETE FROM sports_competition').run()
      const insertComp = sqlite.prepare(`
        INSERT INTO sports_competition (id, name, emblem, startDate, endDate, currentMatchday, syncedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const c of competition) {
        insertComp.run(
          c.id,
          c.name,
          c.emblem,
          c.startdate,
          c.enddate,
          c.currentmatchday,
          c.syncedat
        )
      }
    }
  })

  run()

  console.log('\n✅ Datos copiados a SQLite local.')
  if (users.length > 0) {
    console.log('\n   Usuarios importados:')
    for (const u of users) {
      const alias = u.displayalias ? ` (${u.displayalias})` : ''
      console.log(`   · ${u.email}${alias} — ${u.credits} créditos, ${u.totalpoints} pts`)
    }
  }
  console.log('\n   Reinicia npm run dev si estaba corriendo.')
}

main().catch((err) => {
  console.error('❌ Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
