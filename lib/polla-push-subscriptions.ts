import { dbAll, dbGet, dbRun } from '@/lib/db'
import { randomUUID } from 'crypto'

export interface PushSubscriptionRow {
  id: string
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent: string | null
  createdAt: string
  updatedAt: string
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function upsertPushSubscription(
  userId: string,
  input: PushSubscriptionInput,
  userAgent?: string | null
): Promise<void> {
  const now = new Date().toISOString()
  const existing = await dbGet<{ id: string }>(
    'SELECT id FROM push_subscriptions WHERE endpoint = ?',
    [input.endpoint]
  )

  if (existing) {
    await dbRun(
      `UPDATE push_subscriptions
       SET userId = ?, p256dh = ?, auth = ?, userAgent = ?, updatedAt = ?
       WHERE endpoint = ?`,
      [userId, input.keys.p256dh, input.keys.auth, userAgent ?? null, now, input.endpoint]
    )
    return
  }

  await dbRun(
    `INSERT INTO push_subscriptions (id, userId, endpoint, p256dh, auth, userAgent, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId, input.endpoint, input.keys.p256dh, input.keys.auth, userAgent ?? null, now, now]
  )
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  await dbRun('DELETE FROM push_subscriptions WHERE userId = ? AND endpoint = ?', [userId, endpoint])
}

export async function getPushSubscriptionsForUser(userId: string): Promise<PushSubscriptionRow[]> {
  return dbAll<PushSubscriptionRow>(
    'SELECT * FROM push_subscriptions WHERE userId = ? ORDER BY updatedAt DESC',
    [userId]
  )
}

export async function getDistinctPushUserIds(): Promise<string[]> {
  const rows = await dbAll<{ userId: string }>(
    'SELECT DISTINCT userId FROM push_subscriptions ORDER BY userId'
  )
  return rows.map((r) => r.userId)
}

export async function getSentNotificationIds(userId: string): Promise<Set<string>> {
  const rows = await dbAll<{ notificationId: string }>(
    'SELECT notificationId FROM push_notification_sent WHERE userId = ?',
    [userId]
  )
  return new Set(rows.map((r) => r.notificationId))
}

export async function markPushNotificationSent(userId: string, notificationId: string): Promise<void> {
  const now = new Date().toISOString()
  const existing = await dbGet<{ id: string }>(
    'SELECT id FROM push_notification_sent WHERE userId = ? AND notificationId = ?',
    [userId, notificationId]
  )
  if (existing) return

  await dbRun(
    `INSERT INTO push_notification_sent (id, userId, notificationId, sentAt)
     VALUES (?, ?, ?, ?)`,
    [randomUUID(), userId, notificationId, now]
  )
}

export async function removePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await dbRun('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint])
}
