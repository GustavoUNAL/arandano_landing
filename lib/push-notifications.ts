export const POLLA_PUSH_DISMISS_SESSION_KEY = 'polla-push-prompt-dismissed-session'

export type PushPermission = NotificationPermission | 'unsupported'

export function getPushPermission(): PushPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const next = await Notification.requestPermission()
  return next
}

export function wasPushPromptDismissedThisSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(POLLA_PUSH_DISMISS_SESSION_KEY) === '1'
}

export function dismissPushPromptForSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(POLLA_PUSH_DISMISS_SESSION_KEY, '1')
}

/** Rutas internas de gestión donde no molestamos con el prompt de push */
export function shouldOfferPushPrompt(pathname: string): boolean {
  const excluded = [
    '/admin',
    '/waiter',
    '/analytics',
    '/inventory',
    '/sales',
    '/expenses',
    '/debts',
    '/tasks',
    '/informes',
    '/seo',
  ]
  return !excluded.some((prefix) => pathname.startsWith(prefix))
}
