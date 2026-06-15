import { isPollaPushConfigured, sweepPollaPushNotifications } from '@/lib/polla-push-server'

/** Cada cuánto revisar alertas pendientes (solo BD, sin API externa) */
const PUSH_SWEEP_MS = 10 * 60_000

let timer: ReturnType<typeof setInterval> | null = null
let running = false
let started = false

export function startPollaPushScheduler(): void {
  if (started) return
  started = true

  if (!isPollaPushConfigured()) {
    console.log('[polla-push] VAPID no configurado — push del servidor desactivado')
    return
  }

  console.log('[polla-push] Scheduler activo (cada', PUSH_SWEEP_MS / 60_000, 'min)')

  const run = () => {
    if (running) return
    running = true
    void sweepPollaPushNotifications()
      .catch((error) => console.warn('[polla-push] Barrido falló', error))
      .finally(() => {
        running = false
      })
  }

  timer = setInterval(run, PUSH_SWEEP_MS)
  setTimeout(run, 15_000)
}

export function stopPollaPushScheduler(): void {
  if (timer) clearInterval(timer)
  timer = null
  started = false
}
