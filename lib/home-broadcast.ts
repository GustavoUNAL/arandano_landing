import type { EnrichedMatch } from '@/lib/football-data'
import { isMatchLive } from '@/lib/sports-polla-shared'

export type HomeBroadcastMode = 'live' | 'upcoming'

export interface KickoffCountdown {
  hours: number
  minutes: number
  label: string
  msUntilKickoff: number
}

export function getKickoffCountdown(utcDate: string): KickoffCountdown {
  const msUntilKickoff = Math.max(0, new Date(utcDate).getTime() - Date.now())
  const hours = Math.floor(msUntilKickoff / (1000 * 60 * 60))
  const minutes = Math.floor((msUntilKickoff % (1000 * 60 * 60)) / (1000 * 60))

  let label: string
  if (msUntilKickoff <= 0) {
    label = 'Muy pronto'
  } else if (hours > 0) {
    label = `${hours} h ${minutes} min`
  } else if (minutes > 0) {
    label = `${minutes} min`
  } else {
    label = 'Menos de 1 min'
  }

  return { hours, minutes, label, msUntilKickoff }
}

export function getFeaturedMatchForHome(
  allMatches: EnrichedMatch[]
): { match: EnrichedMatch; mode: HomeBroadcastMode } | null {
  const live = allMatches
    .filter((m) => m.isLive || isMatchLive(m.status))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

  if (live.length > 0) {
    return { match: live[0], mode: 'live' }
  }

  const upcoming = allMatches
    .filter(
      (m) =>
        (m.status === 'SCHEDULED' || m.status === 'TIMED') &&
        new Date(m.utcDate).getTime() > Date.now()
    )
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

  if (upcoming.length > 0) {
    return { match: upcoming[0], mode: 'upcoming' }
  }

  const happening = allMatches
    .filter((m) => {
      const kickoff = new Date(m.utcDate).getTime()
      return kickoff <= Date.now() && !m.isFinished && m.status !== 'FINISHED'
    })
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())

  if (happening.length > 0) {
    return { match: happening[0], mode: 'live' }
  }

  return null
}
