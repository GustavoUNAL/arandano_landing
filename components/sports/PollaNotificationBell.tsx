'use client'

import PollaNotificationCenter from '@/components/sports/PollaNotificationCenter'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import { perfilPathForPlayMatch } from '@/lib/perfil-routes'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

interface SportsMePayload {
  matches: Array<{
    id: number
    utcDate: string
    homeTeam: { shortName: string; name: string; tla: string }
    awayTeam: { shortName: string; name: string; tla: string }
    isFinished: boolean
    canPredict: boolean
    prediction: MatchPrediction | null
    startsIn: string
    formattedDate: string
  }>
  watchMatches?: SportsMePayload['matches']
  predictions: MatchPrediction[]
}

interface PollaNotificationBellProps {
  isDark?: boolean
  onPlayMatch?: (matchId: number) => void
  className?: string
  size?: 'default' | 'comfortable'
}

export default function PollaNotificationBell({
  isDark = true,
  onPlayMatch,
  className = '',
  size = 'comfortable',
}: PollaNotificationBellProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sportsData, setSportsData] = useState<SportsMePayload | null>(null)

  useEffect(() => {
    if (!session) {
      setSportsData(null)
      return
    }
    let cancelled = false
    fetch('/api/sports/me')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && !json.error) setSportsData(json)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session])

  const notificationMatches = useMemo(() => {
    if (!sportsData) return []
    const watch = sportsData.watchMatches ?? []
    return [...new Map([...sportsData.matches, ...watch].map((m) => [m.id, m] as const)).values()]
  }, [sportsData])

  if (status === 'loading' || !session || !sportsData) return null

  return (
    <PollaNotificationCenter
      matches={notificationMatches}
      predictions={sportsData.predictions}
      isDark={isDark}
      panelAlign="right"
      panelPlacement="below"
      size={size}
      className={className}
      onPlayMatch={
        onPlayMatch ??
        ((matchId) => {
          router.push(perfilPathForPlayMatch(matchId))
        })
      }
    />
  )
}
