'use client'

import { mundialTheme } from '@/lib/mundial-theme-classes'
import { useEffect, useState } from 'react'

function formatAgo(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 8) return 'ahora'
  if (sec < 60) return `hace ${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min} min`
  return `hace ${Math.floor(min / 60)} h`
}

interface LiveSyncBadgeProps {
  isDark?: boolean
  syncing?: boolean
  lastSyncedAt?: number | null
  isLive?: boolean
  className?: string
}

export default function LiveSyncBadge({
  isDark = true,
  syncing = false,
  lastSyncedAt = null,
  isLive = false,
  className = '',
}: LiveSyncBadgeProps) {
  const theme = mundialTheme(isDark)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const label = syncing
    ? 'Actualizando…'
    : isLive
      ? 'Partido en vivo'
      : lastSyncedAt
        ? `Actualizado ${formatAgo(lastSyncedAt)}`
        : 'Sincronizado'

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${className} ${
        isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white shadow-sm'
      }`}
      title="Datos en tiempo real de la polla"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          syncing
            ? 'bg-amber-400 animate-pulse'
            : isLive
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-stone-500'
        }`}
      />
      <span className={theme.mutedSm}>{label}</span>
    </div>
  )
}
