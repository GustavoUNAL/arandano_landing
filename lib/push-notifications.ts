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

/** Rutas de la polla (mundial / perfil) */
export function isPollaRoute(pathname: string): boolean {
  return (
    pathname === '/mundial' ||
    pathname.startsWith('/mundial/') ||
    pathname === '/perfil' ||
    pathname.startsWith('/perfil/') ||
    pathname === '/sports' ||
    pathname.startsWith('/sports/')
  )
}

export function shouldOfferPushPrompt(pathname: string): boolean {
  return isPollaRoute(pathname)
}
