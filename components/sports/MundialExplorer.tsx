'use client'

import type { EnrichedMatch, FootballTeamDetail, KnockoutRound, WorldCupFullData, WorldCupGroup } from '@/lib/football-data'
import { canViewMatchHub, isMatchHappeningNow } from '@/lib/sports-polla-shared'
import { getFinishedMatchWinner, winnerBadge } from '@/lib/match-display'
import {
  IconBall,
  IconGlobe,
  IconGroups,
  IconTrophy,
} from '@/components/sports/SportsIcons'
import TeamCrest from '@/components/sports/TeamCrest'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { MUNDIAL_2026 } from '@/lib/world-cup-info'
import { useCallback, useMemo, useState } from 'react'

type MundialTab = 'info' | 'grupos' | 'llaves' | 'equipos'

const GROUP_ACCENTS_DARK = [
  'border-rose-500/40 from-rose-600/15',
  'border-orange-500/40 from-orange-600/15',
  'border-amber-500/40 from-amber-600/15',
  'border-lime-500/40 from-lime-600/15',
  'border-emerald-500/40 from-emerald-600/15',
  'border-teal-500/40 from-teal-600/15',
  'border-cyan-500/40 from-cyan-600/15',
  'border-blue-500/40 from-blue-600/15',
  'border-indigo-500/40 from-indigo-600/15',
  'border-violet-500/40 from-violet-600/15',
  'border-fuchsia-500/40 from-fuchsia-600/15',
  'border-pink-500/40 from-pink-600/15',
]

const GROUP_ACCENTS_LIGHT = [
  'border-rose-300 from-rose-50 to-white',
  'border-orange-300 from-orange-50 to-white',
  'border-amber-300 from-amber-50 to-white',
  'border-lime-300 from-lime-50 to-white',
  'border-emerald-300 from-emerald-50 to-white',
  'border-teal-300 from-teal-50 to-white',
  'border-cyan-300 from-cyan-50 to-white',
  'border-blue-300 from-blue-50 to-white',
  'border-indigo-300 from-indigo-50 to-white',
  'border-violet-300 from-violet-50 to-white',
  'border-fuchsia-300 from-fuchsia-50 to-white',
  'border-pink-300 from-pink-50 to-white',
]

function groupAccent(index: number, isDark: boolean) {
  const list = isDark ? GROUP_ACCENTS_DARK : GROUP_ACCENTS_LIGHT
  return list[index % list.length]
}

const PHASE_ICONS: Record<string, string> = {
  LAST_32: '⚡',
  LAST_16: '🔥',
  QUARTER_FINALS: '💫',
  SEMI_FINALS: '✨',
  THIRD_PLACE: '🥉',
  FINAL: '🏆',
}

function teamName(team: { name?: string | null; shortName?: string | null; tla?: string | null }) {
  if (team?.shortName) return team.shortName
  if (team?.name) return team.name
  if (team?.tla) return team.tla
  return null
}

function groupIndex(id: string) {
  const letter = id.replace('GROUP_', '')
  return letter.charCodeAt(0) - 65
}

function MatchCard({
  match,
  compact,
  selected,
  onSelect,
  isDark = true,
}: {
  match: EnrichedMatch
  compact?: boolean
  selected?: boolean
  onSelect?: (match: EnrichedMatch) => void
  isDark?: boolean
}) {
  const home = teamName(match.homeTeam)
  const away = teamName(match.awayTeam)
  const played = match.isFinished
  const live = match.isLive
  const winner = getFinishedMatchWinner(match)
  const score =
    match.displayScore.home != null
      ? `${match.displayScore.home} : ${match.displayScore.away}`
      : null

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className={`w-full text-left rounded-xl border transition-all ${
        selected
          ? isDark
            ? 'border-emerald-400/50 bg-emerald-950/30 ring-1 ring-emerald-500/30'
            : 'border-emerald-200/80 bg-emerald-50/50 ring-1 ring-emerald-100'
          : live
            ? isDark
              ? 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400/50'
              : 'border-emerald-200/70 bg-emerald-50/40 hover:border-emerald-300/80'
            : isDark
              ? 'border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent hover:border-emerald-500/30 hover:bg-white/[0.08]'
              : 'border-stone-200/60 bg-white/80 hover:border-emerald-200/70 hover:bg-emerald-50/20'
      } ${compact ? 'p-2.5' : 'p-3'}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 flex flex-col items-center gap-1 min-w-0 rounded-lg py-1 ${
            winner === 'home' ? 'bg-yellow-500/10 ring-1 ring-yellow-400/30' : ''
          }`}
        >
          <div className="relative">
            <TeamCrest src={match.homeTeam.crest} alt={home ?? 'Local'} size={compact ? 32 : 36} />
            {winner === 'home' && (
              <span className="absolute -top-1 -right-1 text-sm drop-shadow">⭐</span>
            )}
          </div>
          <p
            className={`text-[10px] font-semibold truncate w-full text-center ${
              isDark ? 'text-stone-300' : 'text-stone-800'
            }`}
          >
            {home ?? <span className={`italic ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>Por definir</span>}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1 px-1">
          {score ? (
            <p
              className={`font-display text-lg font-bold tabular-nums ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}
            >
              {score}
            </p>
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark
                  ? 'bg-stone-800 border border-white/10'
                  : 'bg-stone-100 border border-stone-300'
              }`}
            >
              <span className={`text-[9px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>VS</span>
            </div>
          )}
          <p
            className={`text-[9px] font-semibold whitespace-nowrap ${
              isDark ? 'text-stone-500' : 'text-stone-700'
            }`}
          >
            {match.formattedDate.split(',')[0]}
          </p>
        </div>
        <div
          className={`flex-1 flex flex-col items-center gap-1 min-w-0 rounded-lg py-1 ${
            winner === 'away' ? 'bg-yellow-500/10 ring-1 ring-yellow-400/30' : ''
          }`}
        >
          <div className="relative">
            <TeamCrest src={match.awayTeam.crest} alt={away ?? 'Visitante'} size={compact ? 32 : 36} />
            {winner === 'away' && (
              <span className="absolute -top-1 -right-1 text-sm drop-shadow">⭐</span>
            )}
          </div>
          <p
            className={`text-[10px] font-semibold truncate w-full text-center ${
              isDark ? 'text-stone-300' : 'text-stone-800'
            }`}
          >
            {away ?? <span className={`italic ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>Por definir</span>}
          </p>
        </div>
      </div>
      <p
        className={`text-center text-[10px] font-semibold mt-2 ${
          live
            ? isDark
              ? 'text-emerald-400'
              : 'text-emerald-700'
            : winner === 'draw'
              ? isDark
                ? 'text-amber-400'
                : 'text-amber-700'
              : played
                ? isDark
                  ? 'text-stone-400'
                  : 'text-stone-600'
                : isDark
                  ? 'text-emerald-400/80'
                  : 'text-emerald-700'
        }`}
      >
        {live
          ? `🔴 En vivo · ${match.statusLabel}`
          : winner === 'draw'
            ? '🤝 Empate'
            : winner
              ? '🏁 Finalizado'
              : score && played
                ? 'Finalizado'
                : match.startsIn}
      </p>
      {match.venue && !compact && (
        <p
          className={`text-center text-[9px] mt-1 truncate ${
            isDark ? 'text-stone-500' : 'text-stone-600'
          }`}
        >
          {match.venue}
        </p>
      )}
    </button>
  )
}

function StatPill({ label, home, away }: { label: string; home: number | null | undefined; away: number | null | undefined }) {
  if (home == null && away == null) return null
  return (
    <div className="flex items-center justify-between text-[11px] py-1.5 border-b border-white/5 last:border-0">
      <span className="font-semibold tabular-nums w-8 text-right">{home ?? 0}</span>
      <span className="text-stone-500 uppercase text-[9px] tracking-wide flex-1 text-center">{label}</span>
      <span className="font-semibold tabular-nums w-8">{away ?? 0}</span>
    </div>
  )
}

function MatchDetailPanel({
  match,
  loading,
  liveData,
  onClose,
  isDark,
}: {
  match: EnrichedMatch
  loading: boolean
  liveData: {
    match: EnrichedMatch
    stats?: { totalPicks: number; homeWinPct: number; drawPct: number; awayWinPct: number }
    userPrediction?: { homeScore: number; awayScore: number } | null
  } | null
  onClose: () => void
  isDark: boolean
}) {
  const m = liveData?.match ?? match
  const score = m.displayScore
  const winner = getFinishedMatchWinner(m)

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'border-emerald-500/25 bg-stone-900/95' : 'border-emerald-200 bg-white shadow-lg'
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${
          isDark
            ? 'border-white/10 bg-emerald-950/40'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            isDark ? 'text-emerald-300' : 'text-emerald-800'
          }`}
        >
          {m.isLive ? '🔴 Partido en vivo' : 'Detalle del partido'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`text-sm px-2 ${isDark ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}
        >
          ✕
        </button>
      </div>

      {winner && (
        <div
          className={`px-4 py-2 text-center text-xs font-semibold ${
            winner === 'draw'
              ? 'bg-amber-500/15 text-amber-200 border-b border-amber-500/20'
              : 'bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-yellow-600/20 text-yellow-100 border-b border-yellow-500/25'
          }`}
        >
          {winner === 'draw' ? (
            '🤝 Empate'
          ) : winner === 'home' ? (
            <>⭐ Gana {m.homeTeam.shortName}</>
          ) : (
            <>⭐ Gana {m.awayTeam.shortName}</>
          )}
          {m.stage === 'FINAL' && winner !== 'draw' && ' · 🏆 Campeón'}
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex-1 text-center rounded-xl py-2 ${
              winner === 'home' ? 'bg-yellow-500/10 ring-1 ring-yellow-400/40' : ''
            }`}
          >
            <div className="relative inline-block">
              <TeamCrest src={m.homeTeam.crest} alt="" size={48} className="mx-auto mb-2" />
              {winnerBadge(winner, 'home') && (
                <span className="absolute -top-1 -right-2 text-lg">{winnerBadge(winner, 'home')}</span>
              )}
            </div>
            <p className="text-xs font-bold truncate">{m.homeTeam.shortName}</p>
          </div>
          <div className="shrink-0 text-center px-2">
            {m.isLive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {m.statusLabel}
              </span>
            )}
            <p
              className={`font-display text-3xl font-bold tabular-nums ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}
            >
              {score?.home ?? '–'}
              <span className={`mx-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>:</span>
              {score?.away ?? '–'}
            </p>
            {m.score.halfTime.home != null && (
              <p className="text-[10px] text-stone-500 mt-1">
                HT {m.score.halfTime.home}-{m.score.halfTime.away}
              </p>
            )}
          </div>
          <div
            className={`flex-1 text-center rounded-xl py-2 ${
              winner === 'away' ? 'bg-yellow-500/10 ring-1 ring-yellow-400/40' : ''
            }`}
          >
            <div className="relative inline-block">
              <TeamCrest src={m.awayTeam.crest} alt="" size={48} className="mx-auto mb-2" />
              {winnerBadge(winner, 'away') && (
                <span className="absolute -top-1 -right-2 text-lg">{winnerBadge(winner, 'away')}</span>
              )}
            </div>
            <p className="text-xs font-bold truncate">{m.awayTeam.shortName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {[
            { label: 'Fase', value: m.stageLabel, span: false },
            ...(m.groupLabel ? [{ label: 'Grupo', value: m.groupLabel, span: false }] : []),
            { label: 'Fecha', value: m.formattedDate, span: true },
            ...(m.venue ? [{ label: 'Sede', value: m.venue, span: true }] : []),
          ].map((cell) => (
            <div
              key={cell.label}
              className={`rounded-lg px-3 py-2 border ${
                cell.span ? 'col-span-2' : ''
              } ${
                isDark
                  ? 'bg-black/30 border-white/5'
                  : 'bg-white border-stone-200 shadow-sm'
              }`}
            >
              <p className={`text-[9px] uppercase font-semibold ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                {cell.label}
              </p>
              <p className={`font-semibold mt-0.5 ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                {cell.value}
              </p>
            </div>
          ))}
        </div>

        {liveData?.userPrediction && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-center">
            <p className="text-[9px] uppercase text-amber-300 mb-1">Tu marcador</p>
            <p className="font-display text-xl font-bold tabular-nums text-amber-100">
              {liveData.userPrediction.homeScore} : {liveData.userPrediction.awayScore}
            </p>
          </div>
        )}

        {loading && (
          <p className="text-center text-xs text-stone-500 animate-pulse">Cargando estadísticas…</p>
        )}

        {(m.homeTeam.statistics || m.awayTeam.statistics) && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2">Estadísticas en vivo</p>
            <StatPill label="Posesión %" home={m.homeTeam.statistics?.ball_possession} away={m.awayTeam.statistics?.ball_possession} />
            <StatPill label="Tiros" home={m.homeTeam.statistics?.shots} away={m.awayTeam.statistics?.shots} />
            <StatPill label="A puerta" home={m.homeTeam.statistics?.shots_on_goal} away={m.awayTeam.statistics?.shots_on_goal} />
            <StatPill label="Córners" home={m.homeTeam.statistics?.corners} away={m.awayTeam.statistics?.corners} />
            <StatPill label="Faltas" home={m.homeTeam.statistics?.fouls} away={m.awayTeam.statistics?.fouls} />
          </div>
        )}

        {liveData?.stats && liveData.stats.totalPicks > 0 && (
          <div className={`rounded-xl border px-3 py-2 ${isDark ? 'border-white/10 bg-black/20' : 'border-stone-200'}`}>
            <p className="text-[10px] uppercase text-stone-500 mb-1">Polla · {liveData.stats.totalPicks} picks</p>
            <p className="text-[11px] text-stone-400">
              Local {liveData.stats.homeWinPct}% · Empate {liveData.stats.drawPct}% · Visitante {liveData.stats.awayWinPct}%
            </p>
          </div>
        )}

        {m.goals && m.goals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2">Goles</p>
            <ul className="space-y-1">
              {[...m.goals].reverse().slice(0, 8).map((g, i) => (
                <li key={`${g.minute}-${i}`} className="text-[11px] flex gap-2 text-stone-300">
                  <span className="text-emerald-400 font-bold tabular-nums">{g.minute}&apos;</span>
                  <span className="truncate">{g.scorer?.name ?? 'Gol'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function GroupStandings({
  group,
  accent,
  onSelect,
  selectedId,
  isDark = true,
}: {
  group: WorldCupGroup
  accent: string
  onSelect?: (match: EnrichedMatch) => void
  selectedId?: number | null
  isDark?: boolean
}) {
  const letter = group.id.replace('GROUP_', '')
  return (
    <div className={`rounded-2xl border bg-gradient-to-b to-transparent overflow-hidden shadow-sm ${accent}`}>
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isDark ? 'border-white/10' : 'border-stone-200/80 bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl font-bold ${
              isDark
                ? 'bg-black/30 border border-white/10 text-white'
                : 'bg-white border border-stone-300 text-stone-900 shadow-sm'
            }`}
          >
            {letter}
          </div>
          <div>
            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>{group.label}</p>
            <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
              {group.matches.length} partidos
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <div
          className={`grid grid-cols-[1.5rem_1fr] gap-x-2 gap-y-0 text-[10px] uppercase tracking-wide px-1 mb-1 font-semibold ${
            isDark ? 'text-stone-500' : 'text-stone-600'
          }`}
        >
          <span>#</span>
          <span>Selección</span>
        </div>
        {group.teams.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 mb-1 ${
              t.name === 'Colombia'
                ? isDark
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-amber-50 border border-amber-200'
                : isDark
                  ? 'bg-black/20'
                  : 'bg-white/80 border border-stone-200/80'
            }`}
          >
            <span className={`w-5 text-center text-xs font-bold ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
              {i + 1}
            </span>
            <TeamCrest src={t.crest} alt={t.name} size={26} />
            <span className={`text-xs font-medium truncate flex-1 ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
              {t.shortName || t.name}
            </span>
            <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>
              {t.tla}
            </span>
          </div>
        ))}
      </div>
      <div className={`px-3 pb-3 space-y-2 ${isDark ? '' : 'bg-white/40'}`}>
        <p
          className={`text-[10px] font-bold uppercase tracking-wider px-1 pt-2 ${
            isDark ? 'text-stone-500' : 'text-emerald-800'
          }`}
        >
          Calendario
        </p>
        {group.matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            compact
            onSelect={onSelect}
            selected={selectedId === m.id}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  )
}

function BracketRound({
  round,
  isFinal,
  onSelect,
  selectedId,
  isDark = true,
}: {
  round: KnockoutRound
  isFinal?: boolean
  onSelect?: (match: EnrichedMatch) => void
  selectedId?: number | null
  isDark?: boolean
}) {
  const icon = PHASE_ICONS[round.stage] ?? '⚽'
  return (
    <div className="relative pl-6">
      <div
        className={`absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b ${
          isDark ? 'from-emerald-500/50 via-emerald-500/20' : 'from-emerald-300/70 via-emerald-100/50'
        } to-transparent`}
      />
      <div
        className={`absolute left-0.5 top-4 w-3 h-3 rounded-full border-2 ${
          isDark
            ? 'bg-emerald-600 border-stone-950 shadow shadow-emerald-500/50'
            : 'bg-emerald-500/80 border-white shadow-sm'
        }`}
      />
      <div
        className={`ml-2 rounded-2xl border overflow-hidden ${
          isFinal
            ? isDark
              ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/30 via-emerald-950/40 to-stone-950'
              : 'border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-stone-50 to-emerald-50/40'
            : isDark
              ? 'border-white/10 bg-white/[0.03]'
              : 'border-stone-200/60 bg-stone-50/90 shadow-sm'
        }`}
      >
        <div
          className={`px-4 py-3 flex items-center justify-between border-b ${
            isFinal
              ? isDark
                ? 'bg-yellow-500/10 border-white/10'
                : 'bg-amber-50/50 border-amber-100'
              : isDark
                ? 'bg-black/20 border-white/10'
                : 'bg-stone-100/50 border-stone-200/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-stone-800'}`}>{round.label}</h3>
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isDark ? 'text-stone-500 bg-stone-900' : 'text-stone-600 bg-stone-100'
            }`}
          >
            {round.matches.length} {round.matches.length === 1 ? 'partido' : 'partidos'}
          </span>
        </div>
        <div className="p-3 grid gap-2 sm:grid-cols-2">
          {round.matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onSelect={onSelect}
              selected={selectedId === m.id}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamCard({
  team,
  rank,
  isDark = true,
}: {
  team: FootballTeamDetail
  rank: number
  isDark?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isColombia = team.name === 'Colombia'

  const detailCell = isDark
    ? 'rounded-lg bg-black/30 px-3 py-2'
    : 'rounded-lg bg-stone-100/80 border border-stone-200/50 px-3 py-2'

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isColombia
          ? isDark
            ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 to-stone-950'
            : 'border-amber-200/70 bg-amber-50/40'
          : isDark
            ? 'border-white/10 bg-white/[0.03] hover:border-emerald-500/20'
            : 'border-stone-200/60 bg-white/70 hover:border-emerald-200/70 hover:bg-emerald-50/20'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <span
          className={`text-[10px] font-mono w-5 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}
        >
          {String(rank).padStart(2, '0')}
        </span>
        <TeamCrest src={team.crest} alt={team.name} size={36} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>
            {team.name}
          </p>
          <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{team.areaName}</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
            isDark
              ? 'text-stone-400 bg-stone-900'
              : 'text-stone-600 bg-stone-100 border border-stone-200/60'
          }`}
        >
          {team.tla}
        </span>
      </button>
      {open && (
        <div
          className={`px-4 pb-4 pt-0 mx-3 grid grid-cols-2 gap-2 text-[11px] border-t ${
            isDark ? 'border-white/5' : 'border-stone-200/50'
          }`}
        >
          {team.coach && (
            <div className={`col-span-2 ${detailCell}`}>
              <p className={`text-[9px] uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                Director técnico
              </p>
              <p className={`font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>{team.coach}</p>
            </div>
          )}
          {team.founded && (
            <div className={detailCell}>
              <p className={`text-[9px] uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Fundación</p>
              <p className={isDark ? 'text-stone-200' : 'text-stone-700'}>{team.founded}</p>
            </div>
          )}
          <div className={detailCell}>
            <p className={`text-[9px] uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Plantel</p>
            <p className={isDark ? 'text-stone-200' : 'text-stone-700'}>{team.squadSize} jugadores</p>
          </div>
          {team.clubColors && (
            <div className={`col-span-2 ${detailCell}`}>
              <p className={`text-[9px] uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Colores</p>
              <p className={isDark ? 'text-stone-200' : 'text-stone-700'}>{team.clubColors}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MundialExplorer({
  data,
  isDark = true,
}: {
  data: WorldCupFullData
  isDark?: boolean
}) {
  const theme = mundialTheme(isDark)
  const inactiveBtn = isDark ? 'bg-white/5 text-stone-400' : 'bg-stone-100/80 text-stone-600'
  const inactiveChip = isDark
    ? 'bg-white/5 text-stone-400 border border-white/10'
    : 'bg-white/70 text-stone-600 border border-stone-200/60'
  const activeTab = isDark
    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
    : 'bg-emerald-600/90 text-white shadow-sm'
  const [tab, setTab] = useState<MundialTab>('llaves')
  const [teamSearch, setTeamSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState(data.groups[0]?.id ?? '')
  const [groupsView, setGroupsView] = useState<'single' | 'all'>('single')
  const [selectedMatch, setSelectedMatch] = useState<EnrichedMatch | null>(null)
  const [liveDetail, setLiveDetail] = useState<{
    match: EnrichedMatch
    stats?: { totalPicks: number; homeWinPct: number; drawPct: number; awayWinPct: number }
    userPrediction?: { homeScore: number; awayScore: number } | null
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadMatchDetail = useCallback(async (match: EnrichedMatch) => {
    setSelectedMatch(match)
    setLiveDetail(null)
    const needsApi =
      match.isLive ||
      match.isFinished ||
      canViewMatchHub(match.status, match.utcDate) ||
      isMatchHappeningNow(match.status, match.utcDate)
    if (!needsApi) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/sports/matches/${match.id}`)
      if (res.ok) {
        const json = await res.json()
        setLiveDetail({
          match: json.match,
          stats: json.stats,
          userPrediction: json.userPrediction,
        })
      }
    } catch {
      /* datos básicos del catálogo */
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase()
    if (!q) return data.teams
    return data.teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tla.toLowerCase().includes(q) ||
        t.areaName.toLowerCase().includes(q)
    )
  }, [data.teams, teamSearch])

  const selectedGroup = data.groups.find((g) => g.id === activeGroup)

  const tabs: { id: MundialTab; label: string; Icon: typeof IconGroups }[] = [
    { id: 'grupos', label: 'Grupos', Icon: IconGroups },
    { id: 'llaves', label: 'Llaves', Icon: IconTrophy },
    { id: 'equipos', label: 'Equipos', Icon: IconBall },
    { id: 'info', label: 'Info', Icon: IconGlobe },
  ]

  return (
    <div className="space-y-4">
      {/* Header Mundial */}
      <div
        className={`relative rounded-2xl overflow-hidden border ${
          isDark ? 'border-white/10' : 'border-stone-200/60'
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-br from-emerald-800/90 via-stone-900 to-stone-950'
              : 'bg-gradient-to-br from-emerald-50/90 via-stone-50 to-teal-50/80'
          }`}
        />
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBIMDQwTTQwIDBWNDBaIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')] ${
            isDark ? 'opacity-50' : 'opacity-30'
          }`}
        />
        <div className="relative px-4 py-5 flex items-center gap-4">
          <TeamCrest src={data.competition.emblem} alt="Mundial" size={56} />
          <div>
            <p
              className={`text-[10px] uppercase tracking-widest font-semibold ${
                isDark ? 'text-emerald-200/90' : 'text-emerald-700/80'
              }`}
            >
              FIFA 2026
            </p>
            <h2
              className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}
            >
              Copa Mundial
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {data.stats.totalTeams} equipos · {data.groups.length} grupos · {data.stats.totalMatches} partidos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex gap-1.5 p-1 rounded-2xl border ${
          isDark ? 'bg-stone-900/80 border-white/10' : 'bg-stone-100 border-stone-200'
        }`}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all ${
              tab === t.id
                ? activeTab
                : isDark
                  ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
            }`}
          >
            <t.Icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </div>

      {selectedMatch && (
        <MatchDetailPanel
          match={selectedMatch}
          loading={detailLoading}
          liveData={liveDetail}
          onClose={() => {
            setSelectedMatch(null)
            setLiveDetail(null)
          }}
          isDark={isDark}
        />
      )}

      {tab === 'grupos' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGroupsView('single')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
                groupsView === 'single' ? 'bg-emerald-600 text-white' : inactiveBtn
              }`}
            >
              Por grupo
            </button>
            <button
              type="button"
              onClick={() => setGroupsView('all')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
                groupsView === 'all' ? 'bg-emerald-600 text-white' : inactiveBtn
              }`}
            >
              Ver todos
            </button>
          </div>

          {groupsView === 'single' && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {data.groups.map((g) => {
                const letter = g.id.replace('GROUP_', '')
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGroup(g.id)}
                    className={`shrink-0 w-10 h-10 rounded-xl font-display font-bold text-sm transition-all ${
                      activeGroup === g.id
                        ? 'bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-900/30'
                        : inactiveChip
                    }`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          )}

          {groupsView === 'single' && selectedGroup && (
            <GroupStandings
              group={selectedGroup}
              accent={groupAccent(groupIndex(selectedGroup.id), isDark)}
              onSelect={loadMatchDetail}
              selectedId={selectedMatch?.id ?? null}
              isDark={isDark}
            />
          )}

          {groupsView === 'all' && (
            <div className="space-y-4">
              {data.groups.map((g) => (
                <GroupStandings
                  key={g.id}
                  group={g}
                  accent={groupAccent(groupIndex(g.id), isDark)}
                  onSelect={loadMatchDetail}
                  selectedId={selectedMatch?.id ?? null}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'llaves' && (
        <div className="space-y-6">
          <div className={`rounded-2xl border px-4 py-3.5 flex gap-3 items-start mx-1 ${isDark ? 'border-emerald-500/25 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
            <span className="text-xl shrink-0">🏋️</span>
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                Polla de entrenamiento · 16vos y Octavos
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${theme.muted}`}>
                Los partidos de esta fase son de entrenamiento. Juega y practica — los puntos no cuentan en la polla final (que arranca desde Cuartos).
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {data.knockoutRounds.map((round) => (
              <BracketRound
                key={round.stage}
                round={round}
                isFinal={round.stage === 'FINAL'}
                onSelect={loadMatchDetail}
                selectedId={selectedMatch?.id ?? null}
                isDark={isDark}
              />
            ))}
          </div>
          {data.knockoutRounds.length === 0 && (
            <p className={`text-center text-sm py-8 ${theme.muted}`}>Sin datos de llaves aún</p>
          )}
        </div>
      )}

      {tab === 'equipos' && (
        <div className="space-y-3">
          <div className="relative">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              🔍
            </span>
            <input
              type="search"
              placeholder="Buscar por país o código..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-stone-900/80 border-white/10 text-white placeholder:text-stone-600 focus:ring-emerald-500/50'
                  : 'bg-white/80 border-stone-200/70 text-stone-800 placeholder:text-stone-400 focus:ring-emerald-200/80 focus:border-emerald-200'
              }`}
            />
          </div>
          <p className={`text-xs text-center ${theme.muted}`}>{filteredTeams.length} selecciones clasificadas</p>
          <div className="space-y-2">
            {filteredTeams.map((team, i) => (
              <TeamCard key={team.id} team={team} rank={i + 1} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🌎', label: 'Sedes', value: 'EE.UU. · México · Canadá' },
              { icon: '🏟️', label: 'Ciudades', value: `${MUNDIAL_2026.hostCities} sedes` },
              { icon: '👥', label: 'Equipos', value: `${data.stats.totalTeams} selecciones` },
              { icon: '⚽', label: 'Partidos', value: `${data.stats.totalMatches} encuentros` },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-3 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-stone-200/60 bg-stone-50/80'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <p className={`text-[10px] uppercase mt-2 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                  {item.label}
                </p>
                <p
                  className={`text-xs font-medium mt-0.5 leading-snug ${
                    isDark ? 'text-stone-200' : 'text-stone-700'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-white/10' : 'border-stone-200/60 bg-white/60'
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100/60 border-stone-200/50'
              }`}
            >
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-stone-800'}`}>
                Fases del torneo
              </h4>
            </div>
            <div className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-stone-200/50'}>
              {MUNDIAL_2026.phases.map((p, i) => (
                <div key={p.key} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDark
                        ? 'bg-emerald-600/20 border border-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-50 border border-emerald-200/60 text-emerald-700'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                      {p.label}
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                      {p.matches} partidos
                    </p>
                  </div>
                  <div
                    className={`h-1.5 w-16 rounded-full overflow-hidden shrink-0 ${
                      isDark ? 'bg-stone-800' : 'bg-stone-200'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-400/80'}`}
                      style={{ width: `${(p.matches / 72) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-3 ${
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200/60 bg-stone-50/80'
            }`}
          >
            <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-stone-800'}`}>
              ¿Cómo funciona?
            </h4>
            {MUNDIAL_2026.format.map((line, i) => (
              <div key={line} className="flex gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isDark
                      ? 'bg-emerald-600/30 text-emerald-300'
                      : 'bg-emerald-100/80 text-emerald-700'
                  }`}
                >
                  {i + 1}
                </div>
                <p className={`text-xs leading-relaxed pt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {line}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`rounded-xl border p-4 text-center text-xs ${
              isDark
                ? 'border-emerald-500/20 bg-emerald-950/20 text-stone-400'
                : 'border-emerald-200/60 bg-emerald-50/40 text-stone-600'
            }`}
          >
            <p className={`font-semibold mb-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Partido inaugural
            </p>
            <p>{MUNDIAL_2026.openingMatch}</p>
            <p className={`mt-2 font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Gran final</p>
            <p>{MUNDIAL_2026.finalVenue}</p>
          </div>
        </div>
      )}
    </div>
  )
}
