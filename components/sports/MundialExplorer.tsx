'use client'

import type { EnrichedMatch, FootballTeamDetail, KnockoutRound, WorldCupFullData, WorldCupGroup } from '@/lib/football-data'
import { MUNDIAL_2026 } from '@/lib/world-cup-info'
import {
  IconBall,
  IconGlobe,
  IconGroups,
  IconTrophy,
} from '@/components/sports/SportsIcons'
import TeamCrest from '@/components/sports/TeamCrest'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { useMemo, useState } from 'react'

type MundialTab = 'info' | 'grupos' | 'llaves' | 'equipos'

const GROUP_ACCENTS = [
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

function MatchCard({ match, compact }: { match: EnrichedMatch; compact?: boolean }) {
  const home = teamName(match.homeTeam)
  const away = teamName(match.awayTeam)
  const played = match.status === 'FINISHED'
  const score =
    played && match.score.fullTime.home != null
      ? `${match.score.fullTime.home} : ${match.score.fullTime.away}`
      : null

  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <TeamCrest src={match.homeTeam.crest} alt={home ?? 'Local'} size={compact ? 32 : 36} />
          <p className="text-[10px] font-semibold text-stone-300 truncate w-full text-center">
            {home ?? <span className="text-stone-600 italic">Por definir</span>}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1 px-1">
          {score ? (
            <p className="font-display text-lg font-bold text-berry-300 tabular-nums">{score}</p>
          ) : (
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-stone-500">VS</span>
            </div>
          )}
          <p className="text-[9px] text-stone-500 whitespace-nowrap">{match.formattedDate.split(',')[0]}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <TeamCrest src={match.awayTeam.crest} alt={away ?? 'Visitante'} size={compact ? 32 : 36} />
          <p className="text-[10px] font-semibold text-stone-300 truncate w-full text-center">
            {away ?? <span className="text-stone-600 italic">Por definir</span>}
          </p>
        </div>
      </div>
      {!score && (
        <p className="text-center text-[10px] text-berry-400 font-medium mt-2">{match.startsIn}</p>
      )}
    </div>
  )
}

function GroupStandings({ group, accent }: { group: WorldCupGroup; accent: string }) {
  const letter = group.id.replace('GROUP_', '')
  return (
    <div className={`rounded-2xl border bg-gradient-to-b to-transparent overflow-hidden ${accent}`}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center font-display text-xl font-bold text-white">
            {letter}
          </div>
          <div>
            <p className="font-semibold text-sm">{group.label}</p>
            <p className="text-[10px] text-stone-500">{group.matches.length} partidos</p>
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="grid grid-cols-[1.5rem_1fr] gap-x-2 gap-y-0 text-[10px] text-stone-500 uppercase tracking-wide px-1 mb-1">
          <span>#</span>
          <span>Selección</span>
        </div>
        {group.teams.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 mb-1 ${
              t.name === 'Colombia' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-black/20'
            }`}
          >
            <span className="w-5 text-center text-xs font-bold text-stone-500">{i + 1}</span>
            <TeamCrest src={t.crest} alt={t.name} size={26} />
            <span className="text-xs font-medium truncate flex-1">{t.shortName || t.name}</span>
            <span className="text-[10px] text-stone-600 font-mono">{t.tla}</span>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 space-y-2">
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-1 pt-1">Calendario</p>
        {group.matches.map((m) => (
          <MatchCard key={m.id} match={m} compact />
        ))}
      </div>
    </div>
  )
}

function BracketRound({ round, isFinal }: { round: KnockoutRound; isFinal?: boolean }) {
  const icon = PHASE_ICONS[round.stage] ?? '⚽'
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-berry-500/50 via-berry-500/20 to-transparent" />
      <div className="absolute left-0.5 top-4 w-3 h-3 rounded-full bg-berry-600 border-2 border-stone-950 shadow shadow-berry-500/50" />
      <div className={`ml-2 rounded-2xl border overflow-hidden ${
        isFinal
          ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/30 via-berry-950/50 to-stone-950'
          : 'border-white/10 bg-white/[0.03]'
      }`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b border-white/10 ${
          isFinal ? 'bg-yellow-500/10' : 'bg-black/20'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className="font-semibold text-sm">{round.label}</h3>
          </div>
          <span className="text-[10px] text-stone-500 bg-stone-900 px-2 py-0.5 rounded-full">
            {round.matches.length} {round.matches.length === 1 ? 'partido' : 'partidos'}
          </span>
        </div>
        <div className="p-3 space-y-2">
          {round.matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamCard({ team, rank }: { team: FootballTeamDetail; rank: number }) {
  const [open, setOpen] = useState(false)
  const isColombia = team.name === 'Colombia'

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isColombia
          ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 to-stone-950'
          : 'border-white/10 bg-white/[0.03] hover:border-berry-500/20'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <span className="text-[10px] text-stone-600 font-mono w-5">{String(rank).padStart(2, '0')}</span>
        <TeamCrest src={team.crest} alt={team.name} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{team.name}</p>
          <p className="text-[10px] text-stone-500">{team.areaName}</p>
        </div>
        <span className="text-[10px] font-bold text-stone-600 bg-stone-900 px-2 py-1 rounded-md">{team.tla}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5 mx-3 grid grid-cols-2 gap-2 text-[11px]">
          {team.coach && (
            <div className="col-span-2 rounded-lg bg-black/30 px-3 py-2">
              <p className="text-stone-500 text-[9px] uppercase">Director técnico</p>
              <p className="text-stone-200 font-medium">{team.coach}</p>
            </div>
          )}
          {team.founded && (
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <p className="text-stone-500 text-[9px] uppercase">Fundación</p>
              <p className="text-stone-200">{team.founded}</p>
            </div>
          )}
          <div className="rounded-lg bg-black/30 px-3 py-2">
            <p className="text-stone-500 text-[9px] uppercase">Plantel</p>
            <p className="text-stone-200">{team.squadSize} jugadores</p>
          </div>
          {team.clubColors && (
            <div className="col-span-2 rounded-lg bg-black/30 px-3 py-2">
              <p className="text-stone-500 text-[9px] uppercase">Colores</p>
              <p className="text-stone-200">{team.clubColors}</p>
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
  const inactiveBtn = isDark ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-600'
  const inactiveChip = isDark
    ? 'bg-white/5 text-stone-400 border border-white/10'
    : 'bg-stone-100 text-stone-600 border border-stone-200'
  const [tab, setTab] = useState<MundialTab>('grupos')
  const [teamSearch, setTeamSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState(data.groups[0]?.id ?? '')
  const [groupsView, setGroupsView] = useState<'single' | 'all'>('single')

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
      <div className="relative rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-berry-800/80 via-berry-950 to-stone-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBIMDQwTTQwIDBWNDBaIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative px-4 py-5 flex items-center gap-4">
          <TeamCrest src={data.competition.emblem} alt="Mundial" size={56} />
          <div>
            <p className="text-berry-300 text-[10px] uppercase tracking-widest font-semibold">FIFA 2026</p>
            <h2 className="font-display text-lg font-bold">Copa Mundial</h2>
            <p className="text-xs text-stone-400 mt-0.5">
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
                ? 'bg-berry-600 text-white shadow-lg shadow-berry-900/40'
                : isDark
                  ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <t.Icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grupos' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGroupsView('single')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
                groupsView === 'single' ? 'bg-berry-600 text-white' : inactiveBtn
              }`}
            >
              Por grupo
            </button>
            <button
              type="button"
              onClick={() => setGroupsView('all')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
                groupsView === 'all' ? 'bg-berry-600 text-white' : inactiveBtn
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
                        ? 'bg-berry-600 text-white scale-110 shadow-lg shadow-berry-900/40'
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
              accent={GROUP_ACCENTS[groupIndex(selectedGroup.id) % GROUP_ACCENTS.length]}
            />
          )}

          {groupsView === 'all' && (
            <div className="space-y-4">
              {data.groups.map((g) => (
                <GroupStandings
                  key={g.id}
                  group={g}
                  accent={GROUP_ACCENTS[groupIndex(g.id) % GROUP_ACCENTS.length]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'llaves' && (
        <div className="space-y-6">
          <div className="text-center px-4">
            <p className={`text-xs leading-relaxed ${theme.muted}`}>
              Ruta hacia la final · Los cruces de dieciseisavos se confirman al terminar la fase de grupos
            </p>
          </div>
          <div className="space-y-6">
            {data.knockoutRounds.map((round) => (
              <BracketRound
                key={round.stage}
                round={round}
                isFinal={round.stage === 'FINAL'}
              />
            ))}
          </div>
          {data.knockoutRounds.length === 0 && (
            <p className="text-center text-stone-500 text-sm py-8">Sin datos de llaves aún</p>
          )}
        </div>
      )}

      {tab === 'equipos' && (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">🔍</span>
            <input
              type="search"
              placeholder="Buscar por país o código..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-stone-900/80 border border-white/10 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-berry-500/50"
            />
          </div>
          <p className="text-xs text-stone-500 text-center">{filteredTeams.length} selecciones clasificadas</p>
          <div className="space-y-2">
            {filteredTeams.map((team, i) => (
              <TeamCard key={team.id} team={team} rank={i + 1} />
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
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="text-xl">{item.icon}</span>
                <p className="text-[10px] text-stone-500 uppercase mt-2">{item.label}</p>
                <p className="text-xs font-semibold text-stone-200 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 bg-black/30 border-b border-white/10">
              <h4 className="font-semibold text-sm">Fases del torneo</h4>
            </div>
            <div className="divide-y divide-white/5">
              {MUNDIAL_2026.phases.map((p, i) => (
                <div key={p.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-berry-600/20 border border-berry-500/20 flex items-center justify-center text-xs font-bold text-berry-300">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-[10px] text-stone-500">{p.matches} partidos</p>
                  </div>
                  <div className="h-1.5 w-16 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-berry-500 rounded-full"
                      style={{ width: `${(p.matches / 72) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <h4 className="font-semibold text-sm">¿Cómo funciona?</h4>
            {MUNDIAL_2026.format.map((line, i) => (
              <div key={line} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-berry-600/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-berry-300">
                  {i + 1}
                </div>
                <p className="text-xs text-stone-400 leading-relaxed pt-0.5">{line}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-berry-500/20 bg-berry-950/20 p-4 text-center text-xs text-stone-400">
            <p className="font-semibold text-berry-300 mb-1">Partido inaugural</p>
            <p>{MUNDIAL_2026.openingMatch}</p>
            <p className="mt-2 font-semibold text-berry-300">Gran final</p>
            <p>{MUNDIAL_2026.finalVenue}</p>
          </div>
        </div>
      )}
    </div>
  )
}
