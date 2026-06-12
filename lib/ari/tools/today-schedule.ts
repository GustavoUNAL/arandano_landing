import { getWorldCupFullData } from '@/lib/football-data'

const COLOMBIA_TZ = 'America/Bogota'

export async function getTodaySchedule() {
  const worldCup = await getWorldCupFullData()
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: COLOMBIA_TZ })

  const todayMatches = worldCup.allMatches.filter((m) => {
    const key = new Date(m.utcDate).toLocaleDateString('en-CA', { timeZone: COLOMBIA_TZ })
    return key === todayKey
  })

  return {
    date: todayKey,
    total: todayMatches.length,
    live: todayMatches.filter((m) => m.isLive).length,
    upcoming: todayMatches.filter((m) => !m.isFinished && !m.isLive).length,
    matches: todayMatches.map((m) => ({
      id: m.id,
      home: m.homeTeam.shortName || m.homeTeam.name,
      away: m.awayTeam.shortName || m.awayTeam.name,
      time: m.formattedDate,
      status: m.statusLabel,
      isLive: m.isLive,
    })),
  }
}
