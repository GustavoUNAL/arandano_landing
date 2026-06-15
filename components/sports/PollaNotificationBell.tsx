'use client'

import PollaNotificationCenter from '@/components/sports/PollaNotificationCenter'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import { perfilPathForPlayMatch } from '@/lib/perfil-routes'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

interface NotificationMatch {
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
  const [matches, setMatches] = useState<NotificationMatch[]>([])
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) {
      setMatches([])
      setPredictions([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetch('/api/sports/notifications')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || json.error) return
        setMatches(json.matches ?? [])
        setPredictions(json.predictions ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  if (status === 'loading' || !session) return null

  return (
    <PollaNotificationCenter
      matches={matches}
      predictions={predictions}
      loading={loading}
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
