'use client'

import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { AfEvent, AfTeamLineup, AfTeamPlayers, AfTeamStats } from '@/lib/api-football-client'
import { parseAfStat } from '@/lib/api-football-client'
import { useState } from 'react'

// ─── StatBar ──────────────────────────────────────────────────────────────────

function StatBar({
  label,
  home,
  away,
  isDark,
  percent = false,
}: {
  label: string
  home: number | null
  away: number | null
  isDark: boolean
  percent?: boolean
}) {
  if (home == null && away == null) return null
  const h = home ?? 0
  const a = away ?? 0
  const total = h + a || 1
  const homePct = Math.round((h / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] tabular-nums">
        <span className="font-semibold">{h}{percent ? '%' : ''}</span>
        <span className="text-stone-500 uppercase tracking-wide text-[9px]">{label}</span>
        <span className="font-semibold">{a}{percent ? '%' : ''}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <div className="h-full bg-berry-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-sky-500 flex-1" />
      </div>
    </div>
  )
}

// ─── Events tab ───────────────────────────────────────────────────────────────

function EventIcon({ type, detail }: { type: string; detail: string }) {
  if (type === 'Goal') {
    if (detail.includes('Penalty')) return <span>🎯</span>
    if (detail.includes('Own')) return <span>⚽😬</span>
    return <span>⚽</span>
  }
  if (type === 'Card') {
    if (detail.includes('Red') || detail.includes('Second Yellow')) return <span>🟥</span>
    return <span>🟨</span>
  }
  if (type === 'subst') return <span>🔄</span>
  if (type === 'Var') return <span>📺</span>
  return <span>•</span>
}

function EventsList({
  events,
  homeTeamId,
  isDark,
}: {
  events: AfEvent[]
  homeTeamId: number
  isDark: boolean
}) {
  const theme = mundialTheme(isDark)
  if (!events || events.length === 0) {
    return <p className={`text-xs text-center py-6 ${theme.mutedSm}`}>Sin eventos registrados aún</p>
  }

  return (
    <div className="space-y-1.5">
      {events.map((ev, i) => {
        const isHome = ev.team.id === homeTeamId
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${theme.cardSoft} ${
              isHome ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <span className={`font-bold tabular-nums shrink-0 w-8 ${isHome ? 'text-left' : 'text-right'} ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>
              {ev.time.elapsed}{ev.time.extra ? `+${ev.time.extra}` : ''}&apos;
            </span>
            <EventIcon type={ev.type} detail={ev.detail} />
            <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
              <p className="font-medium truncate">{ev.player.name}</p>
              {ev.assist?.name && (
                <p className={`text-[10px] ${theme.mutedSm}`}>Asistencia: {ev.assist.name}</p>
              )}
              {ev.type === 'subst' && ev.assist?.name && (
                <p className={`text-[10px] ${theme.mutedSm}`}>Entra: {ev.assist.name}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Lineup tab ───────────────────────────────────────────────────────────────

const POS_LABEL: Record<string, string> = {
  G: 'POR', D: 'DEF', M: 'MED', F: 'DEL',
}

function LineupTeam({
  lineup,
  isDark,
}: {
  lineup: AfTeamLineup
  isDark: boolean
}) {
  const theme = mundialTheme(isDark)

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <img src={lineup.team.logo} alt={lineup.team.name} className="w-5 h-5 object-contain" />
        <p className="font-semibold text-sm truncate">{lineup.team.name}</p>
        {lineup.formation && (
          <span className={`ml-auto text-xs font-mono ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>
            {lineup.formation}
          </span>
        )}
      </div>
      {lineup.coach.name && (
        <p className={`text-[10px] mb-2 ${theme.mutedSm}`}>DT: {lineup.coach.name}</p>
      )}
      <div className="space-y-1">
        {lineup.startXI.map((p) => (
          <div key={p.player.id} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${theme.cardSoft}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isDark ? 'bg-berry-600/30 text-berry-300' : 'bg-berry-100 text-berry-700'}`}>
              {p.player.number}
            </span>
            <span className="flex-1 truncate">{p.player.name}</span>
            <span className={`text-[9px] font-medium ${theme.mutedSm}`}>{POS_LABEL[p.player.pos] ?? p.player.pos}</span>
          </div>
        ))}
      </div>
      {lineup.substitutes.length > 0 && (
        <details className={`mt-2 text-[10px] ${theme.mutedSm}`}>
          <summary className="cursor-pointer font-medium">Suplentes ({lineup.substitutes.length})</summary>
          <div className="mt-1 space-y-1">
            {lineup.substitutes.map((p) => (
              <div key={p.player.id} className="flex items-center gap-1.5 px-2 py-0.5">
                <span className="w-4 text-right opacity-60">{p.player.number}</span>
                <span className="truncate">{p.player.name}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Players tab ──────────────────────────────────────────────────────────────

function ratingColor(rating: string | null, isDark: boolean) {
  const r = parseFloat(rating ?? '0')
  if (r >= 8) return isDark ? 'text-emerald-400' : 'text-emerald-700'
  if (r >= 7) return isDark ? 'text-sky-400' : 'text-sky-700'
  if (r >= 6) return isDark ? 'text-amber-400' : 'text-amber-700'
  return isDark ? 'text-stone-400' : 'text-stone-500'
}

function PlayersTeam({
  teamPlayers,
  isDark,
}: {
  teamPlayers: AfTeamPlayers
  isDark: boolean
}) {
  const theme = mundialTheme(isDark)
  const starters = teamPlayers.players.filter((p) => !p.statistics[0]?.games.substitute)
  const subs = teamPlayers.players.filter((p) => p.statistics[0]?.games.substitute)

  const renderPlayer = (pe: AfTeamPlayers['players'][0]) => {
    const s = pe.statistics[0]
    if (!s) return null
    return (
      <div key={pe.player.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${theme.cardSoft}`}>
        <div className={`w-8 text-center font-bold text-sm shrink-0 ${ratingColor(s.games.rating, isDark)}`}>
          {s.games.rating ? parseFloat(s.games.rating).toFixed(1) : '–'}
        </div>
        <span className="flex-1 truncate font-medium">{pe.player.name}</span>
        <div className={`flex gap-2 text-[10px] shrink-0 ${theme.mutedSm}`}>
          {s.goals.total != null && s.goals.total > 0 && (
            <span>⚽{s.goals.total}</span>
          )}
          {s.goals.assists != null && s.goals.assists > 0 && (
            <span>🎯{s.goals.assists}</span>
          )}
          {s.cards.yellow > 0 && <span>🟨</span>}
          {s.cards.red > 0 && <span>🟥</span>}
          {s.shots.on != null && (
            <span>{s.shots.on ?? 0}/{s.shots.total ?? 0} tiros</span>
          )}
          {s.games.minutes != null && (
            <span>{s.games.minutes} min</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <img src={teamPlayers.team.logo} alt={teamPlayers.team.name} className="w-5 h-5 object-contain" />
        <p className="font-semibold text-sm">{teamPlayers.team.name}</p>
      </div>
      <div className="space-y-1">
        {starters.map(renderPlayer)}
      </div>
      {subs.length > 0 && (
        <details className="mt-2">
          <summary className={`cursor-pointer text-[10px] font-medium ${mundialTheme(isDark).mutedSm}`}>
            Sustitutos ({subs.length})
          </summary>
          <div className="mt-1 space-y-1">
            {subs.map(renderPlayer)}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'stats' | 'events' | 'lineups' | 'players'

interface MatchAfStatsProps {
  stats: AfTeamStats[]
  events: AfEvent[]
  lineups: AfTeamLineup[]
  players: AfTeamPlayers[]
  homeTeamId: number
  isDark?: boolean
}

export default function MatchAfStats({
  stats,
  events,
  lineups,
  players,
  homeTeamId,
  isDark = true,
}: MatchAfStatsProps) {
  const theme = mundialTheme(isDark)

  const allTabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'stats',   label: 'Estadísticas', show: stats.length > 0 },
    { id: 'events',  label: 'Eventos',      show: true },
    { id: 'lineups', label: 'Alineaciones', show: lineups.length > 0 },
    { id: 'players', label: 'Jugadores',    show: players.length > 0 },
  ]
  const tabs = allTabs.filter((t) => t.show)

  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id ?? 'events')

  if (tabs.length === 0) return null

  const ALL_STATS = [
    { type: 'Ball Possession', label: 'Posesión', percent: true },
    { type: 'Total Shots', label: 'Tiros' },
    { type: 'Shots on Goal', label: 'A puerta' },
    { type: 'Shots off Goal', label: 'Fuera' },
    { type: 'Blocked Shots', label: 'Bloqueados' },
    { type: 'Corner Kicks', label: 'Córners' },
    { type: 'Fouls', label: 'Faltas' },
    { type: 'Offsides', label: 'Fueras de juego' },
    { type: 'Yellow Cards', label: 'Amarillas' },
    { type: 'Red Cards', label: 'Rojas' },
    { type: 'Goalkeeper Saves', label: 'Paradas' },
    { type: 'Total passes', label: 'Pases' },
    { type: 'Passes accurate', label: 'Pases precisos' },
    { type: 'expected_goals', label: 'xG (goles esperados)' },
  ]

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-stone-900/60' : 'bg-stone-100'}`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              activeTab === t.id
                ? isDark ? 'bg-berry-600 text-white' : 'bg-white text-berry-700 shadow-sm'
                : theme.mutedSm
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          {ALL_STATS.map(({ type, label, percent }) => {
            const [h, a] = parseAfStat(stats, type)
            if (h == null && a == null) return null
            return (
              <StatBar key={type} label={label} home={h} away={a} isDark={isDark} percent={percent} />
            )
          })}
        </div>
      )}

      {/* Events */}
      {activeTab === 'events' && (
        <EventsList events={events} homeTeamId={homeTeamId} isDark={isDark} />
      )}

      {/* Lineups */}
      {activeTab === 'lineups' && (
        <div className="space-y-4">
          {lineups.map((l) => (
            <LineupTeam key={l.team.id} lineup={l} isDark={isDark} />
          ))}
        </div>
      )}

      {/* Players */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {players.map((tp) => (
            <PlayersTeam key={tp.team.id} teamPlayers={tp} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  )
}
