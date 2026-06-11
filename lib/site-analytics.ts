import fs from 'fs'
import path from 'path'
import { usesRelationalDb } from './db-utils'
import { dbAll, dbGet, dbRun } from './db'

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

export async function recordSiteClick(
  pagePath: string,
  label: string,
  target: string
): Promise<void> {
  const pathNorm = normalizePath(pagePath)
  const safeLabel = (label || 'click').slice(0, 200)
  const safeTarget = (target || '').slice(0, 500)
  const clickedAt = new Date().toISOString()

  if (usesRelationalDb()) {
    await dbRun('INSERT INTO site_clicks (path, label, target, clickedAt) VALUES (?, ?, ?, ?)', [
      pathNorm,
      safeLabel,
      safeTarget,
      clickedAt,
    ])
    return
  }

  const data = readAnalyticsJson()
  data.clicks.push({ path: pathNorm, label: safeLabel, target: safeTarget, clickedAt })
  writeAnalyticsJson(data)
}

export async function recordPageEngagement(
  pagePath: string,
  durationSeconds: number
): Promise<void> {
  const pathNorm = normalizePath(pagePath)
  const seconds = Math.max(0, Math.min(Math.round(durationSeconds), 7200))
  if (seconds < 3) return
  const recordedAt = new Date().toISOString()

  if (usesRelationalDb()) {
    await dbRun(
      'INSERT INTO site_engagement (path, durationSeconds, recordedAt) VALUES (?, ?, ?)',
      [pathNorm, seconds, recordedAt]
    )
    return
  }

  const data = readAnalyticsJson()
  data.engagement.push({ path: pathNorm, durationSeconds: seconds, recordedAt })
  writeAnalyticsJson(data)
}

export async function getSeoDashboard(days = 30): Promise<SeoDashboard> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  if (usesRelationalDb()) {
    const totalVisitsRow = await dbGet<{ total: number }>(
      'SELECT COUNT(*) AS total FROM site_visits WHERE visitedAt >= ?',
      [sinceIso]
    )

    const uniquePagesRow = await dbGet<{ total: number }>(
      'SELECT COUNT(DISTINCT path) AS total FROM site_visits WHERE visitedAt >= ?',
      [sinceIso]
    )

    const totalClicksRow = await dbGet<{ total: number }>(
      'SELECT COUNT(*) AS total FROM site_clicks WHERE clickedAt >= ?',
      [sinceIso]
    )

    const avgTimeRow = await dbGet<{ avg: number | null }>(
      'SELECT AVG(durationSeconds) AS avg FROM site_engagement WHERE recordedAt >= ?',
      [sinceIso]
    )

    const pageStats = await dbAll<{
      path: string
      visits: number
      avgTimeSeconds: number
      totalTimeSeconds: number
    }>(
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
      `,
      [sinceIso, sinceIso]
    )

    const topClicks = await dbAll<ClickStat>(
      `
        SELECT label, target, path, COUNT(*) AS clicks
        FROM site_clicks
        WHERE clickedAt >= ?
        GROUP BY label, target, path
        ORDER BY clicks DESC
        LIMIT 30
      `,
      [sinceIso]
    )

    const recentVisits = await dbAll<{ path: string; visitedAt: string }>(
      'SELECT path, visitedAt FROM site_visits WHERE visitedAt >= ? ORDER BY visitedAt DESC LIMIT 20',
      [sinceIso]
    )

    return {
      totalVisits: Number(totalVisitsRow?.total) || 0,
      uniquePages: Number(uniquePagesRow?.total) || 0,
      totalClicks: Number(totalClicksRow?.total) || 0,
      avgTimeSeconds: Math.round(Number(avgTimeRow?.avg) || 0),
      pageStats: pageStats.map((p) => ({
        path: p.path,
        visits: Number(p.visits),
        avgTimeSeconds: Math.round(Number(p.avgTimeSeconds)),
        totalTimeSeconds: Number(p.totalTimeSeconds),
      })),
      topClicks: topClicks.map((c) => ({
        ...c,
        clicks: Number(c.clicks),
      })),
      recentVisits,
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
      totalTimeSeconds: 0,
    }
    existing.visits += 1
    pageMap.set(v.path, existing)
  }

  for (const e of engagement) {
    const existing = pageMap.get(e.path) || {
      path: e.path,
      visits: 0,
      avgTimeSeconds: 0,
      totalTimeSeconds: 0,
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
              p.totalTimeSeconds / engagement.filter((e) => e.path === p.path).length
            )
          : 0,
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
      clicks: 0,
    }
    existing.clicks += 1
    clickMap.set(key, existing)
  }

  const topClicks = Array.from(clickMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 30)

  const avgTimeSeconds =
    engagement.length > 0
      ? Math.round(engagement.reduce((s, e) => s + e.durationSeconds, 0) / engagement.length)
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
      .slice(0, 20),
  }
}
