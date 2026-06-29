'use client'

import GroupStagePodium from '@/components/sports/GroupStagePodium'
import PollaModal from '@/components/sports/PollaModal'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import {
  CAFE_LOCATION,
  CAFE_NAME,
  GROUP_STAGE_WINNERS_COUNT,
  KNOCKOUT_OCTAVOS_START_LABEL,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  KNOCKOUT_TRAINING_NOTE,
  PRIZE_CLAIM_DEADLINE_LABEL,
  TOP_WINNERS_COUNT,
  formatCop,
  getKnockoutPrizeBreakdown,
  type KnockoutPrizeShare,
} from '@/lib/polla-rules'
import { firstNameOnly, groupPrizeForRank } from '@/lib/polla-winners'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'
import { useEffect, useState } from 'react'

interface PollaWelcomeModalsProps {
  isDark?: boolean
  userId: string
  userName?: string | null
  groupComplete: boolean
  podiumEntries: LeaderboardEntry[]
  winnerEntry: LeaderboardEntry | null
  passportHolders: number
  knockoutPrizeBreakdown: KnockoutPrizeShare[]
  onBlockingChange?: (blocking: boolean) => void
}

function winnerSeenKey(userId: string) {
  return `polla-winner-seen-${userId}`
}

export default function PollaWelcomeModals({
  isDark = true,
  userId,
  userName,
  groupComplete,
  podiumEntries,
  winnerEntry,
  passportHolders,
  knockoutPrizeBreakdown,
  onBlockingChange,
}: PollaWelcomeModalsProps) {
  const theme = mundialTheme(isDark)
  const [dismissedWinner, setDismissedWinner] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(winnerSeenKey(userId)) === '1'
  })
  const [dismissedProInvite, setDismissedProInvite] = useState(false)

  const showWinner = Boolean(winnerEntry) && !dismissedWinner
  const showProInvite = !showWinner && !dismissedProInvite

  useEffect(() => {
    onBlockingChange?.(showWinner || showProInvite)
  }, [showWinner, showProInvite, onBlockingChange])

  const firstName = firstNameOnly(userName)
  const prize = winnerEntry ? groupPrizeForRank(winnerEntry.winnerRank) : null
  const breakdown = knockoutPrizeBreakdown.length
    ? knockoutPrizeBreakdown
    : getKnockoutPrizeBreakdown(passportHolders)

  if (showWinner && winnerEntry) {
    return (
      <PollaModal
        open
        onClose={() => {
          localStorage.setItem(winnerSeenKey(userId), '1')
          setDismissedWinner(true)
        }}
        isDark={isDark}
        accent="gold"
        size="sm"
        zIndex={106}
        icon={<span className="text-4xl">🎉</span>}
        title="¡Felicitaciones, lo lograste!"
        subtitle={`${firstName ?? winnerEntry.displayAlias} · ${winnerEntry.winnerRank ?? 1}° lugar${
          groupComplete ? ' fase de grupos' : ' podio provisional'
        }`}
        footer={
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(winnerSeenKey(userId), '1')
              setDismissedWinner(true)
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all"
          >
            ¡Voy a reclamar mi premio!
          </button>
        }
      >
        {prize && (
          <p
            className={`text-center text-sm font-semibold mb-4 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}
          >
            Tu premio: {prize.prize}
          </p>
        )}
        <div
          className={`rounded-2xl border px-4 py-4 text-xs space-y-2 ${
            isDark ? 'border-emerald-500/30 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className={`font-semibold text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
            Reclámalo en {CAFE_NAME}
          </p>
          <p className={theme.mutedSm}>{CAFE_LOCATION}</p>
          <p className={theme.mutedSm}>
            Antes del fin del Mundial ({PRIZE_CLAIM_DEADLINE_LABEL}), con documento y la misma cuenta de Google.
          </p>
          <p className={`font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            ☕ Te esperamos en el café para entregarte tu premio.
          </p>
        </div>
      </PollaModal>
    )
  }

  if (!showProInvite) return null

  return (
    <PollaModal
      open
      onClose={() => setDismissedProInvite(true)}
      isDark={isDark}
      accent="berry"
      size="lg"
      zIndex={105}
      icon={<span className="text-3xl">🏆</span>}
      title={firstName ? `¡Hola ${firstName}!` : '¡Únete a la polla fase pro!'}
      subtitle="Adquiere tu pasaporte para la polla final."
      footer={
        <button
          type="button"
          onClick={() => setDismissedProInvite(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-berry-600 to-berry-500 hover:from-berry-500 hover:to-berry-400 text-white text-sm font-semibold shadow-lg shadow-berry-900/30 transition-all"
        >
          ¡Quiero participar en la fase pro!
        </button>
      }
    >
      <div className="space-y-4">
        {podiumEntries.length > 0 && (
          <GroupStagePodium entries={podiumEntries} isDark={isDark} complete={groupComplete} />
        )}
        <div
          className={`rounded-2xl border px-4 py-3.5 text-xs space-y-2 ${
            isDark ? 'border-berry-500/30 bg-berry-950/30' : 'border-berry-200 bg-berry-50'
          }`}
        >
          <p className={`font-semibold text-sm ${isDark ? 'text-berry-200' : 'text-berry-800'}`}>
            Participa en la polla fase pro
          </p>
          <p className={theme.muted}>
            Desde el {KNOCKOUT_OCTAVOS_START_LABEL}: {KNOCKOUT_TRAINING_NOTE.toLowerCase()}
          </p>
          <p className={theme.muted}>
            Paga el pasaporte, adjunta comprobante en tu perfil y compite por el pozo con {TOP_WINNERS_COUNT}{' '}
            ganadores.
          </p>
          <ul className={`space-y-1 ${theme.mutedSm}`}>
            {breakdown.map((row) => (
              <li key={row.place} className="flex justify-between gap-2">
                <span>{row.place}</span>
                <span className="font-medium">{row.percent}% · {formatCop(row.amountCop)}</span>
              </li>
            ))}
          </ul>
          <p className={`text-[10px] pt-1 ${theme.mutedSm}`}>
            {passportHolders} pasaportes activos — el pozo crece con cada uno
          </p>
        </div>
        <p className={`text-[11px] text-center ${theme.mutedSm}`}>
          Top {GROUP_STAGE_WINNERS_COUNT} en grupos ganan premios en {CAFE_NAME}
        </p>
      </div>
    </PollaModal>
  )
}
