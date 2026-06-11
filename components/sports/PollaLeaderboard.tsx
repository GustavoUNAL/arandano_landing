'use client'

import { IconPremium, IconTrophy } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import {
  GROUP_PASSPORT_LABEL,
  GROUP_STAGE_WINNERS_COUNT,
  KNOCKOUT_PASSPORT_LABEL,
  TOP_WINNERS_COUNT,
  type PollaPhase,
} from '@/lib/polla-rules'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'

const ANIMAL_EMOJI: Record<string, string> = {
  Jaguar: '🐆',
  Águila: '🦅',
  Lobo: '🐺',
  Tigre: '🐯',
  Puma: '🐱',
  Zorro: '🦊',
  Búho: '🦉',
  Cóndor: '🦅',
  Delfín: '🐬',
  Oso: '🐻',
  Halcón: '🦅',
  Pantera: '🐆',
  Toro: '🐂',
  Lince: '🐱',
  Ballena: '🐋',
  Koala: '🐨',
  Mapache: '🦝',
  Pingüino: '🐧',
  Llama: '🦙',
  Cebra: '🦓',
  Ciervo: '🦌',
  Serpiente: '🐍',
  Tortuga: '🐢',
  Rana: '🐸',
}

const WINNER_MEDALS = ['🥇', '🥈', '🥉', '4°', '5°']

function animalEmoji(alias: string) {
  const animal = alias.split(' ')[0]
  return ANIMAL_EMOJI[animal] ?? '🐾'
}

interface PollaLeaderboardProps {
  entries: LeaderboardEntry[]
  compact?: boolean
  isDark?: boolean
  phase?: PollaPhase
  title?: string
  subtitle?: string
}

function defaultSubtitle(phase: PollaPhase) {
  if (phase === 'knockout') {
    return `Solo ${KNOCKOUT_PASSPORT_LABEL} · ranking de eliminatorias`
  }
  return `Hasta ${GROUP_STAGE_WINNERS_COUNT} ganadores · ${GROUP_PASSPORT_LABEL}`
}

export default function PollaLeaderboard({
  entries,
  compact = false,
  isDark = true,
  phase = 'group',
  title,
  subtitle,
}: PollaLeaderboardProps) {
  const theme = mundialTheme(isDark)
  const resolvedTitle =
    title ?? (phase === 'knockout' ? 'Tabla eliminatorias' : 'Tabla fase de grupos')
  const resolvedSubtitle = subtitle ?? defaultSubtitle(phase)
  const maxWinners = phase === 'group' ? GROUP_STAGE_WINNERS_COUNT : TOP_WINNERS_COUNT
  const winners = entries.filter((e) => e.isWinner)

  const hasPhasePassport = (entry: LeaderboardEntry) =>
    phase === 'knockout' ? entry.hasKnockoutPassport : entry.hasPassport

  if (entries.length === 0) {
    return (
      <div className={`rounded-2xl border p-6 text-center ${theme.cardSoft}`}>
        <IconTrophy className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
        <p className={`text-sm ${theme.muted}`}>Aún no hay jugadores en la tabla</p>
        <p className={`text-xs mt-1 ${theme.mutedSm}`}>
          {phase === 'knockout'
            ? 'Aún no hay jugadores con pasaporte eliminatorias'
            : 'Sé el primero en pronosticar'}
        </p>
      </div>
    )
  }

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${theme.border}`}>
        <IconTrophy className="w-4 h-4 text-berry-400 shrink-0" />
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{resolvedTitle}</h3>
          {!compact && <p className="text-[10px] text-stone-500 truncate">{resolvedSubtitle}</p>}
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En vivo
        </span>
      </div>

      {winners.length > 0 && !compact && (
        <div className={`px-4 py-3 border-b ${theme.podioBox}`}>
          <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${theme.accentLink}`}>
            Podio · {winners.length} de {maxWinners} ganadores
          </p>
          <div className="flex flex-wrap gap-2">
            {winners.map((w) => (
              <div
                key={w.displayAlias}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border ${
                  w.isCurrentUser ? theme.podioChipYou : theme.podioChip
                }`}
              >
                <span>{WINNER_MEDALS[(w.winnerRank ?? 1) - 1]}</span>
                <span>{animalEmoji(w.displayAlias)}</span>
                <span className="font-medium truncate max-w-[7rem]">{w.displayAlias}</span>
                <span className={`font-bold tabular-nums ${theme.accent}`}>{w.totalPoints}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`text-[10px] uppercase tracking-wide border-b ${theme.tableHead}`}>
              <th className="px-3 py-2 font-medium w-10">#</th>
              <th className="px-3 py-2 font-medium">Jugador</th>
              <th className="px-3 py-2 font-medium text-right">Pts</th>
              {!compact && (
                <>
                  <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">Calif.</th>
                  <th className="px-3 py-2 font-medium text-right hidden md:table-cell">3·2·1</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={`${entry.rank}-${entry.displayAlias}`}
                className={`border-b last:border-0 transition-opacity ${
                  entry.isWinner
                    ? theme.tableRowWinner
                    : entry.isCurrentUser
                      ? theme.tableRowYou
                      : theme.tableRow
                } ${hasPhasePassport(entry) ? '' : 'opacity-45'}`}
              >
                <td className="px-3 py-2.5 tabular-nums font-semibold">
                  {entry.isWinner ? (
                    <span className={isDark ? 'text-yellow-400' : 'text-amber-600'}>
                      {WINNER_MEDALS[(entry.winnerRank ?? 1) - 1]}
                    </span>
                  ) : (
                    <span className={theme.mutedSm}>{entry.rank}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{animalEmoji(entry.displayAlias)}</span>
                    <span
                      className={`truncate font-medium ${
                        entry.isCurrentUser ? theme.tableNameYou : theme.tableName
                      }`}
                    >
                      {entry.displayAlias}
                      {entry.isCurrentUser && (
                        <span className={`text-[10px] ml-1 ${theme.accentLink}`}>(tú)</span>
                      )}
                    </span>
                    {hasPhasePassport(entry) ? (
                      <span
                        className={`inline-flex items-center shrink-0 ${
                          isDark ? 'text-amber-400' : 'text-amber-600'
                        }`}
                        title="Pasaporte de fase activo"
                      >
                        <IconPremium className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      !compact && (
                        <span
                          className={`text-[9px] shrink-0 ${theme.mutedSm}`}
                          title="Sin pasaporte de esta fase"
                        >
                          sin pasaporte
                        </span>
                      )
                    )}
                    {!entry.qualifiesForPodium && hasPhasePassport(entry) && entry.settledCount > 0 && !compact && (
                      <span className={`text-[9px] shrink-0 ${theme.mutedSm}`} title="Faltan picks calificados para el podio">
                        ·
                      </span>
                    )}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${theme.accent}`}>
                  {entry.totalPoints}
                </td>
                {!compact && (
                  <>
                    <td className={`px-3 py-2.5 text-right tabular-nums hidden sm:table-cell ${theme.muted}`}>
                      {entry.settledCount}/{entry.picksCount}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums hidden md:table-cell text-[10px] ${theme.mutedSm}`}>
                      {entry.exactHits}·{entry.goalDiffHits}·{entry.resultHits}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
