import webpush from 'web-push'
import { getWorldCupFullData } from '@/lib/football-data'
import { buildPollaNotifications, type PollaNotification } from '@/lib/polla-notifications'
import { perfilPathForPlayMatch } from '@/lib/perfil-routes'
import {
  getDistinctPushUserIds,
  getPushSubscriptionsForUser,
  getSentNotificationIds,
  markPushNotificationSent,
  removePushSubscriptionByEndpoint,
  type PushSubscriptionRow,
} from '@/lib/polla-push-subscriptions'
import { getUserPredictions, isMatchPredictable } from '@/lib/sports-polla'
import { canViewMatchHub } from '@/lib/sports-polla-shared'
import type { MatchPrediction } from '@/lib/sports-polla-shared'

const MAX_PUSHES_PER_USER_PER_SWEEP = 2

let vapidConfigured = false

export function isPollaPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

export function getPollaVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true
  if (!isPollaPushConfigured()) return false

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  vapidConfigured = true
  return true
}

function notificationUrl(n: PollaNotification): string {
  if (n.kind === 'settled') return '/perfil?tab=picks'
  if (n.matchId && (n.kind === 'upcoming' || n.kind === 'missed')) {
    return perfilPathForPlayMatch(n.matchId)
  }
  return '/perfil'
}

function rowToWebPushSubscription(row: PushSubscriptionRow): webpush.PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  }
}

export async function sendPollaPushToUser(
  userId: string,
  notification: PollaNotification
): Promise<number> {
  if (!ensureVapidConfigured()) return 0

  const subs = await getPushSubscriptionsForUser(userId)
  if (subs.length === 0) return 0

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    tag: notification.id,
    url: notificationUrl(notification),
  })

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(rowToWebPushSubscription(sub), payload)
      sent++
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await removePushSubscriptionByEndpoint(sub.endpoint)
      } else {
        console.warn('[polla-push] Error enviando a', sub.endpoint.slice(0, 48), error)
      }
    }
  }

  if (sent > 0) {
    await markPushNotificationSent(userId, notification.id)
  }
  return sent
}

async function buildNotificationsForUser(userId: string) {
  const worldCup = await getWorldCupFullData()
  const predictions = await getUserPredictions(userId)
  const predictionMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]))

  const enrichMatchRow = (m: (typeof worldCup.allMatches)[0]) => ({
    ...m,
    prediction: predictionMap[m.id] ?? null,
    canPredict: isMatchPredictable(m.status, m.utcDate),
    canViewHub: canViewMatchHub(m.status, m.utcDate),
  })

  const matches = worldCup.allMatches.map(enrichMatchRow)
  const notifications = buildPollaNotifications({
    matches,
    predictions: predictions as MatchPrediction[],
  })

  return notifications
}

export async function sweepPollaPushNotifications(): Promise<void> {
  if (!ensureVapidConfigured()) return

  const userIds = await getDistinctPushUserIds()
  if (userIds.length === 0) return

  for (const userId of userIds) {
    try {
      const [notifications, sentIds] = await Promise.all([
        buildNotificationsForUser(userId),
        getSentNotificationIds(userId),
      ])

      const pending = notifications.filter((n) => !sentIds.has(n.id))
      for (const notification of pending.slice(0, MAX_PUSHES_PER_USER_PER_SWEEP)) {
        await sendPollaPushToUser(userId, notification)
      }
    } catch (error) {
      console.warn('[polla-push] Error en barrido para usuario', userId, error)
    }
  }
}
