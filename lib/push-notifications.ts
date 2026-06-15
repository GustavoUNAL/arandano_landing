export const POLLA_PUSH_DISMISS_SESSION_KEY = 'polla-push-prompt-dismissed-session'
export const POLLA_WEB_PUSH_ACTIVE_KEY = 'polla-web-push-active'

export type PushPermission = NotificationPermission | 'unsupported'

export type PollaPushSubscribeResult =
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'misconfigured'
  | 'error'

export function getPushPermission(): PushPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function hasActiveWebPushSubscription(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(POLLA_WEB_PUSH_ACTIVE_KEY) === '1'
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export async function registerPollaServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  return registration
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const next = await Notification.requestPermission()
  return next
}

async function resolveVapidPublicKey(): Promise<string | null> {
  const fromBuild = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (fromBuild) return fromBuild

  try {
    const vapidRes = await fetch('/api/sports/push/vapid')
    if (!vapidRes.ok) return null
    const { publicKey } = (await vapidRes.json()) as { publicKey?: string }
    return publicKey ?? null
  } catch {
    return null
  }
}

/** Permiso del navegador + suscripción Web Push en el servidor (funciona con la app cerrada) */
export async function subscribeToPollaPush(): Promise<PollaPushSubscribeResult> {
  if (!isWebPushSupported()) return 'unsupported'

  const permission = await requestPushPermission()
  if (permission !== 'granted') {
    return permission === 'denied' ? 'denied' : 'unsupported'
  }

  try {
    const publicKey = await resolveVapidPublicKey()
    if (!publicKey) return 'misconfigured'

    const registration = await registerPollaServiceWorker()
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    }

    const saveRes = await fetch('/api/sports/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })

    if (!saveRes.ok) return 'error'

    localStorage.setItem(POLLA_WEB_PUSH_ACTIVE_KEY, '1')
    return 'granted'
  } catch {
    return 'error'
  }
}

/** Re-sincroniza la suscripción si ya hay permiso (p. ej. al volver a abrir /perfil) */
export async function syncPollaPushSubscription(): Promise<void> {
  if (!isWebPushSupported()) return
  if (getPushPermission() !== 'granted') return

  try {
    const publicKey = await resolveVapidPublicKey()
    if (!publicKey) return

    const registration = await registerPollaServiceWorker()
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    }

    await fetch('/api/sports/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })

    localStorage.setItem(POLLA_WEB_PUSH_ACTIVE_KEY, '1')
  } catch {
    /* ignore */
  }
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

export function shouldShowForegroundNotification(): boolean {
  if (typeof window === 'undefined') return false
  if (hasActiveWebPushSubscription()) return false
  return getPushPermission() === 'granted'
}
