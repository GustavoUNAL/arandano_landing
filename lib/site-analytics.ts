import fs from 'fs'
import path from 'path'
import { getDbMode } from './db-utils'
import { getDatabase } from './db-sqlite'

const analyticsJsonPath = path.join(process.cwd(), 'data', 'site-analytics.json')

type ClickEvent = { path: string; label: string; target: string; clickedAt: string }
type EngagementEvent = { path: string; durationSeconds: number; recordedAt: string }

type AnalyticsFile = {
  clicks: ClickEvent[]
  engagement: EngagementEvent[]
}

export type PageVisitStat = {
  path: string
  visits: number
  avgTimeSeconds: number
  totalTimeSeconds: number
}

export type ClickStat = {
  label: string
  target: string
  path: string
  clicks: number
}

export type SeoDashboard = {
  totalVisits: number
  uniquePages: number
  totalClicks: number
  avgTimeSeconds: number
  pageStats: PageVisitStat[]
  topClicks: ClickStat[]
  recentVisits: Array<{ path: string; visitedAt: string }>
}

function readAnalyticsJson(): AnalyticsFile {
  try {
    if (fs.existsSync(analyticsJsonPath)) {
      return JSON.parse(fs.readFileSync(analyticsJsonPath, 'utf8')) as AnalyticsFile
    }
  } catch {
    /* ignore */
  }
  return { clicks: [], engagement: [] }
}

function writeAnalyticsJson(data: AnalyticsFile): void {
  fs.mkdirSync(path.dirname(analyticsJsonPath), { recursive: true })
  fs.writeFileSync(analyticsJsonPath, JSON.stringify(data, null, 2), 'utf8')
}

function normalizePath(pagePath: string): string {
  const p = (pagePath || '/').split('?')[0].split('#')[0]
  return p || '/'
}

function ensureAnalyticsTables(): void {
  if (getDbMode() !== 'sqlite') return
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      label TEXT NOT NULL,
      target TEXT NOT NULL,
      clickedAt TEXT NOT NULL
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_engagement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL,
      recordedAt TEXT NOT NULL
    )
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_site_clicks_clickedAt ON site_clicks(clickedAt);
    CREATE INDEX IF NOT EXISTS idx_site_engagement_recordedAt ON site_engagement(recordedAt);
  `)
}

export function recordSiteClick(
  pagePath: string,
  label: string,
  target: string
): void {
  const pathNorm = normalizePath(pagePath)
  const safeLabel = (label || 'click').slice(0, 200)
  const safeTarget = (target || '').slice(0, 500)
  const clickedAt = new Date().toISOString()

  if (getDbMode() === 'sqlite') {
    ensureAnalyticsTables()
    const db = getDatabase()
    db.prepare(
      'INSERT INTO site_clicks (path, label, target, clickedAt) VALUES (?, ?, ?, ?)'
    ).run(pathNorm, safeLabel, safeTarget, clickedAt)
    return
  }

  const data = readAnalyticsJson()
  data.clicks.push({ path: pathNorm, label: safeLabel, target: safeTarget, clickedAt })
  writeAnalyticsJson(data)
}

export function recordPageEngagement(pagePath: string, durationSeconds: number): void {
  const pathNorm = normalizePath(pagePath)
  const seconds = Math.max(0, Math.min(Math.round(durationSeconds), 7200))
  if (seconds < 3) return
  const recordedAt = new Date().toISOString()

  if (getDbMode() === 'sqlite') {
    ensureAnalyticsTables()
    const db = getDatabase()
    db.prepare(
      'INSERT INTO site_engagement (path, durationSeconds, recordedAt) VALUES (?, ?, ?)'
    ).run(pathNorm, seconds, recordedAt)
    return
  }

  const data = readAnalyticsJson()
  data.engagement.push({ path: pathNorm, durationSeconds: seconds, recordedAt })
  writeAnalyticsJson(data)
}

export function getSeoDashboard(days = 30): SeoDashboard {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  if (getDbMode() === 'sqlite') {
    ensureAnalyticsTables()
    const db = getDatabase()

    const totalVisitsRow = db
      .prepare('SELECT COUNT(*) AS total FROM site_visits WHERE visitedAt >= ?')
      .get(sinceIso) as { total: number }

    const uniquePagesRow = db
      .prepare('SELECT COUNT(DISTINCT path) AS total FROM site_visits WHERE visitedAt >= ?')
      .get(sinceIso) as { total: number }

    const totalClicksRow = db
      .prepare('SELECT COUNT(*) AS total FROM site_clicks WHERE clickedAt >= ?')
      .get(sinceIso) as { total: number }

    const avgTimeRow = db
      .prepare(
        'SELECT AVG(durationSeconds) AS avg FROM site_engagement WHERE recordedAt >= ?'
      )
      .get(sinceIso) as { avg: number | null }

    const pageStats = db
      .prepare(
        `
        SELECT
          v.path,
          v.visits,
          COALESCE(e.avgTimeSeconds, 0) AS avgTimeSeconds,
          COALESCE(e.totalTimeSeconds, 0) AS totalTimeSeconds
        FROM (
          SELECT path, COUNT(*) AS visits
          FROM site_visits
          WHERE visitedAt >= ?
          GROUP BY path
        ) v
        LEFT JOIN (
          SELECT
            path,
            AVG(durationSeconds) AS avgTimeSeconds,
            SUM(durationSeconds) AS totalTimeSeconds
          FROM site_engagement
          WHERE recordedAt >= ?
          GROUP BY path
        ) e ON e.path = v.path
        ORDER BY v.visits DESC
        LIMIT 50
      `
      )
      .all(sinceIso, sinceIso) as Array<{
        path: string
        visits: number
        avgTimeSeconds: number
        totalTimeSeconds: number
      }>

    const topClicks = db
      .prepare(
        `
        SELECT label, target, path, COUNT(*) AS clicks
        FROM site_clicks
        WHERE clickedAt >= ?
        GROUP BY label, target, path
        ORDER BY clicks DESC
        LIMIT 30
      `
      )
      .all(sinceIso) as ClickStat[]

    const recentVisits = db
      .prepare(
        'SELECT path, visitedAt FROM site_visits WHERE visitedAt >= ? ORDER BY visitedAt DESC LIMIT 20'
      )
      .all(sinceIso) as Array<{ path: string; visitedAt: string }>

    return {
      totalVisits: Number(totalVisitsRow.total) || 0,
      uniquePages: Number(uniquePagesRow.total) || 0,
      totalClicks: Number(totalClicksRow.total) || 0,
      avgTimeSeconds: Math.round(Number(avgTimeRow.avg) || 0),
      pageStats: pageStats.map((p) => ({
        path: p.path,
        visits: Number(p.visits),
        avgTimeSeconds: Math.round(Number(p.avgTimeSeconds)),
        totalTimeSeconds: Number(p.totalTimeSeconds)
      })),
      topClicks: topClicks.map((c) => ({
        ...c,
        clicks: Number(c.clicks)
      })),
      recentVisits
    }
  }

  const data = readAnalyticsJson()
  const visitsPath = path.join(process.cwd(), 'data', 'site-visits.json')

  let visits: Array<{ path: string; visitedAt: string }> = []
  try {
    if (fs.existsSync(visitsPath)) {
      const parsed = JSON.parse(fs.readFileSync(visitsPath, 'utf8')) as {
        visits: Array<{ path: string; visitedAt: string }>
      }
      visits = parsed.visits.filter((v) => v.visitedAt >= sinceIso)
    }
  } catch {
    /* ignore */
  }

  const clicks = data.clicks.filter((c) => c.clickedAt >= sinceIso)
  const engagement = data.engagement.filter((e) => e.recordedAt >= sinceIso)

  const pageMap = new Map<string, PageVisitStat>()
  for (const v of visits) {
    const existing = pageMap.get(v.path) || {
      path: v.path,
      visits: 0,
      avgTimeSeconds: 0,
      totalTimeSeconds: 0
    }
    existing.visits += 1
    pageMap.set(v.path, existing)
  }

  for (const e of engagement) {
    const existing = pageMap.get(e.path) || {
      path: e.path,
      visits: 0,
      avgTimeSeconds: 0,
      totalTimeSeconds: 0
    }
    existing.totalTimeSeconds += e.durationSeconds
    pageMap.set(e.path, existing)
  }

  const pageStats = Array.from(pageMap.values())
    .map((p) => ({
      ...p,
      avgTimeSeconds:
        engagement.filter((e) => e.path === p.path).length > 0
          ? Math.round(
              p.totalTimeSeconds /
                engagement.filter((e) => e.path === p.path).length
            )
          : 0
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 50)

  const clickMap = new Map<string, ClickStat>()
  for (const c of clicks) {
    const key = `${c.path}|${c.label}|${c.target}`
    const existing = clickMap.get(key) || {
      label: c.label,
      target: c.target,
      path: c.path,
      clicks: 0
    }
    existing.clicks += 1
    clickMap.set(key, existing)
  }

  const topClicks = Array.from(clickMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 30)

  const avgTimeSeconds =
    engagement.length > 0
      ? Math.round(
          engagement.reduce((s, e) => s + e.durationSeconds, 0) / engagement.length
        )
      : 0

  return {
    totalVisits: visits.length,
    uniquePages: new Set(visits.map((v) => v.path)).size,
    totalClicks: clicks.length,
    avgTimeSeconds,
    pageStats,
    topClicks,
    recentVisits: visits
      .slice()
      .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
      .slice(0, 20)
  }
}
