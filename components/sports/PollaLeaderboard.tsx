'use client'

import { IconTrophy } from '@/components/sports/SportsIcons'
import { TOP_WINNERS_COUNT } from '@/lib/polla-rules'
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
  title?: string
  subtitle?: string
}

export default function PollaLeaderboard({
  entries,
  compact = false,
  title = 'Tabla en vivo',
  subtitle = `Hasta ${TOP_WINNERS_COUNT} ganadores · nombre de usuario`,
}: PollaLeaderboardProps) {
  const winners = entries.filter((e) => e.isWinner)

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <IconTrophy className="w-8 h-8 mx-auto mb-2 text-stone-600" />
        <p className="text-sm text-stone-500">Aún no hay jugadores en la tabla</p>
        <p className="text-xs text-stone-600 mt-1">Sé el primero en pronosticar</p>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <IconTrophy className="w-4 h-4 text-berry-400 shrink-0" />
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {!compact && <p className="text-[10px] text-stone-500 truncate">{subtitle}</p>}
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En vivo
        </span>
      </div>

      {winners.length > 0 && !compact && (
        <div className="px-4 py-3 border-b border-berry-500/20 bg-berry-950/20">
          <p className="text-[10px] uppercase tracking-widest text-berry-400 font-semibold mb-2">
            Podio · {winners.length} de {TOP_WINNERS_COUNT} ganadores
          </p>
          <div className="flex flex-wrap gap-2">
            {winners.map((w) => (
              <div
                key={w.displayAlias}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border ${
                  w.isCurrentUser
                    ? 'bg-berry-600/30 border-berry-500/40 text-berry-100'
                    : 'bg-white/5 border-white/10 text-stone-200'
                }`}
              >
                <span>{WINNER_MEDALS[(w.winnerRank ?? 1) - 1]}</span>
                <span>{animalEmoji(w.displayAlias)}</span>
                <span className="font-medium truncate max-w-[7rem]">{w.displayAlias}</span>
                <span className="text-berry-300 font-bold tabular-nums">{w.totalPoints}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] text-stone-500 uppercase tracking-wide border-b border-white/5">
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
                className={`border-b border-white/5 last:border-0 ${
                  entry.isWinner
                    ? 'bg-yellow-950/20'
                    : entry.isCurrentUser
                      ? 'bg-berry-950/40'
                      : 'hover:bg-white/[0.02]'
                }`}
              >
                <td className="px-3 py-2.5 tabular-nums font-semibold">
                  {entry.isWinner ? (
                    <span className="text-yellow-400">{WINNER_MEDALS[(entry.winnerRank ?? 1) - 1]}</span>
                  ) : (
                    <span className="text-stone-500">{entry.rank}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{animalEmoji(entry.displayAlias)}</span>
                    <span className={`truncate font-medium ${entry.isCurrentUser ? 'text-berry-300' : 'text-stone-200'}`}>
                      {entry.displayAlias}
                      {entry.isCurrentUser && (
                        <span className="text-[10px] text-berry-400/80 ml-1">(tú)</span>
                      )}
                    </span>
                    {!entry.qualifiesForPodium && entry.settledCount > 0 && !compact && (
                      <span className="text-[9px] text-stone-600 shrink-0" title="Faltan picks calificados para el podio">
                        ·
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-berry-300 tabular-nums">
                  {entry.totalPoints}
                </td>
                {!compact && (
                  <>
                    <td className="px-3 py-2.5 text-right text-stone-400 tabular-nums hidden sm:table-cell">
                      {entry.settledCount}/{entry.picksCount}
                    </td>
                    <td className="px-3 py-2.5 text-right text-stone-500 tabular-nums hidden md:table-cell text-[10px]">
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
