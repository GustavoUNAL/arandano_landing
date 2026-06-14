/**
 * Notificaciones in-app de la polla (recordatorios, resultados, invitaciones).
 */

import type { MatchPrediction } from '@/lib/sports-polla-shared'

export type PollaNotificationKind = 'upcoming' | 'settled' | 'missed' | 'cafe'

export interface PollaNotification {
  id: string
  kind: PollaNotificationKind
  title: string
  message: string
  matchId?: number
  points?: number
  priority: number
  createdAt: string
}

/** Horas antes del pitazo para recordar pronosticar */
export const UPCOMING_REMINDER_HOURS = 48

/** Partidos finalizados recientes sin pick (días) */
export const MISSED_LOOKBACK_DAYS = 3

interface MatchRow {
  id: number
  utcDate: string
  homeTeam: { shortName: string; name: string; tla: string }
  awayTeam: { shortName: string; name: string; tla: string }
  isFinished: boolean
  canPredict: boolean
  prediction: MatchPrediction | null
  startsIn: string
  formattedDate: string
}

function teamLabel(team: { shortName?: string; name?: string; tla?: string }) {
  return team.shortName || team.name || team.tla || '—'
}

function matchTitle(m: Pick<MatchRow, 'homeTeam' | 'awayTeam'>) {
  return `${teamLabel(m.homeTeam)} vs ${teamLabel(m.awayTeam)}`
}

export function buildPollaNotifications(input: {
  matches: MatchRow[]
  predictions: MatchPrediction[]
  now?: number
}): PollaNotification[] {
  const now = input.now ?? Date.now()
  const notifications: PollaNotification[] = []
  const predictedIds = new Set(input.predictions.map((p) => p.matchId))

  for (const m of input.matches) {
    if (!m.canPredict || m.prediction) continue
    const kickoff = new Date(m.utcDate).getTime()
    const hoursUntil = (kickoff - now) / (1000 * 60 * 60)
    if (hoursUntil <= 0 || hoursUntil > UPCOMING_REMINDER_HOURS) continue

    notifications.push({
      id: `upcoming-${m.id}`,
      kind: 'upcoming',
      title: '⏰ Partido pronto',
      message: `${matchTitle(m)} · ${m.startsIn}. Haz tu pronóstico antes del pitazo.`,
      matchId: m.id,
      priority: hoursUntil <= 6 ? 100 : hoursUntil <= 24 ? 80 : 60,
      createdAt: new Date(now).toISOString(),
    })
  }

  for (const p of input.predictions) {
    if (!p.settledAt || p.pointsEarned == null) continue
    const pts = p.pointsEarned
    notifications.push({
      id: `settled-${p.id}`,
      kind: 'settled',
      title: pts > 0 ? '🎉 Puntos sumados' : '📋 Resultado liquidado',
      message:
        pts > 0
          ? `${p.homeTeamName} ${p.homeScore}-${p.awayScore} ${p.awayTeamName}: +${pts} pts (real ${p.actualHomeScore}-${p.actualAwayScore}).`
          : `${p.homeTeamName} vs ${p.awayTeamName}: 0 pts esta vez. ¡Sigue intentando!`,
      matchId: p.matchId,
      points: pts,
      priority: 90,
      createdAt: p.settledAt,
    })
  }

  const lookbackMs = MISSED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  const allFinished = [...input.matches]
  for (const m of allFinished) {
    if (!m.isFinished) continue
    if (predictedIds.has(m.id)) continue
    const finishedAt = new Date(m.utcDate).getTime()
    if (now - finishedAt > lookbackMs) continue

    notifications.push({
      id: `missed-${m.id}`,
      kind: 'missed',
      title: '😅 Te lo perdiste',
      message: `No pronosticaste ${matchTitle(m)}. El próximo partido te espera — entra a jugar.`,
      matchId: m.id,
      priority: 40,
      createdAt: new Date(now).toISOString(),
    })
  }

  notifications.sort((a, b) => b.priority - a.priority)
  return notifications
}

export function loadDismissedNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('polla-notifications-dismissed')
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function dismissNotification(id: string): void {
  if (typeof window === 'undefined') return
  const set = loadDismissedNotificationIds()
  set.add(id)
  localStorage.setItem('polla-notifications-dismissed', JSON.stringify([...set]))
}

export function filterActiveNotifications(
  notifications: PollaNotification[],
  dismissed: Set<string>
): PollaNotification[] {
  return notifications.filter((n) => !dismissed.has(n.id))
}
