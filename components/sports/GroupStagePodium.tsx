'use client'

import { IconTrophy } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { GROUP_STAGE_PRIZES, GROUP_STAGE_WINNERS_COUNT } from '@/lib/polla-rules'
import { firstNameOnly } from '@/lib/polla-winners'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_ORDER = [1, 0, 2] // 2°, 1°, 3° en el escenario visual
const PODIUM_HEIGHT = ['h-16', 'h-24', 'h-12']

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

function animalEmoji(alias: string) {
  const animal = alias.split(' ')[0]
  return ANIMAL_EMOJI[animal] ?? '🐾'
}

function podiumPlayerLabel(entry: LeaderboardEntry) {
  return {
    realName: firstNameOnly(entry.name),
    username: entry.displayAlias,
  }
}

interface GroupStagePodiumProps {
  entries: LeaderboardEntry[]
  isDark?: boolean
  complete?: boolean
  className?: string
}

export default function GroupStagePodium({
  entries,
  isDark = true,
  complete = false,
  className = '',
}: GroupStagePodiumProps) {
  const theme = mundialTheme(isDark)

  if (entries.length === 0) return null

  const title = complete ? 'Podio fase de grupos' : `Top ${GROUP_STAGE_WINNERS_COUNT} provisional · grupos`
  const subtitle = complete
    ? 'Ganadores oficiales de la primera polla'
    : 'Se actualiza en vivo hasta cerrar la fase de grupos'

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft} ${className}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${theme.border}`}>
        <IconTrophy className={`w-4 h-4 shrink-0 ${theme.accentLink}`} />
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className={`text-[10px] truncate ${theme.mutedSm}`}>{subtitle}</p>
        </div>
      </div>

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          {PODIUM_ORDER.map((idx) => {
            const entry = entries[idx]
            if (!entry) {
              return <div key={idx} className="flex-1 max-w-[7rem]" />
            }
            const place = idx + 1
            const prize = GROUP_STAGE_PRIZES[idx]?.prize
            const { realName, username } = podiumPlayerLabel(entry)
            return (
              <div key={entry.displayAlias} className="flex-1 max-w-[7rem] flex flex-col items-center">
                <div className="text-center mb-2 min-h-[4.5rem]">
                  <p className="text-lg leading-none">{MEDALS[idx]}</p>
                  <p className="text-xl mt-1">{animalEmoji(entry.displayAlias)}</p>
                  {realName ? (
                    <>
                      <p
                        className={`text-[11px] font-bold truncate mt-1 px-1 leading-tight ${
                          entry.isCurrentUser ? theme.accent : theme.tableName
                        }`}
                      >
                        {realName}
                      </p>
                      <p className={`text-[10px] truncate px-1 ${theme.mutedSm}`}>@{username}</p>
                    </>
                  ) : (
                    <p
                      className={`text-[11px] font-semibold truncate mt-1 px-1 ${
                        entry.isCurrentUser ? theme.accent : theme.tableName
                      }`}
                    >
                      {username}
                    </p>
                  )}
                  <p className={`text-xs font-bold tabular-nums ${theme.accent}`}>{entry.totalPoints} pts</p>
                </div>
                <div
                  className={`w-full rounded-t-xl border-x border-t flex items-end justify-center pb-2 ${PODIUM_HEIGHT[idx]} ${
                    place === 1
                      ? isDark
                        ? 'bg-gradient-to-t from-amber-900/50 to-amber-600/30 border-amber-500/40'
                        : 'bg-gradient-to-t from-amber-100 to-amber-50 border-amber-300'
                      : isDark
                        ? 'bg-white/5 border-white/10'
                        : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <span
                    className={`font-display text-lg font-bold ${
                      place === 1 ? (isDark ? 'text-amber-300' : 'text-amber-700') : theme.mutedSm
                    }`}
                  >
                    {place}°
                  </span>
                </div>
                {complete && prize && (
                  <p className={`text-[9px] text-center mt-2 leading-tight px-1 ${theme.mutedSm}`}>{prize}</p>
                )}
              </div>
            )
          })}
        </div>

        {entries[3] && (() => {
          const fourth = entries[3]
          const { realName, username } = podiumPlayerLabel(fourth)
          return (
          <div
            className={`mt-4 flex items-center justify-center gap-3 rounded-xl border px-3 py-2.5 max-w-sm mx-auto ${
              isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'
            }`}
          >
            <span className="text-base">4°</span>
            <span className="text-lg">{animalEmoji(fourth.displayAlias)}</span>
            <div className="min-w-0 flex-1 text-left">
              {realName ? (
                <>
                  <p className={`text-xs font-bold truncate ${fourth.isCurrentUser ? theme.accent : theme.tableName}`}>
                    {realName}
                  </p>
                  <p className={`text-[10px] truncate ${theme.mutedSm}`}>@{username}</p>
                </>
              ) : (
                <p className={`text-xs font-semibold truncate ${fourth.isCurrentUser ? theme.accent : theme.tableName}`}>
                  {username}
                </p>
              )}
              <p className={`text-[10px] ${theme.mutedSm}`}>{fourth.totalPoints} pts</p>
            </div>
            {complete && GROUP_STAGE_PRIZES[3]?.prize && (
              <p className={`text-[9px] text-right shrink-0 max-w-[5rem] leading-tight ${theme.mutedSm}`}>
                {GROUP_STAGE_PRIZES[3].prize}
              </p>
            )}
          </div>
          )
        })()}
      </div>
    </section>
  )
}
