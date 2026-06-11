import { mundialTheme } from '@/lib/mundial-theme-classes'
import {
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  pointsToTier,
  tierLabel,
  type MatchPrediction,
} from '@/lib/sports-polla-shared'

function pointsBadge(points: number | null, isDark: boolean) {
  if (points == null) return null
  const tier = pointsToTier(points)
  const label = tierLabel(tier)
  const text =
    points === 0 ? '0 pts' : `+${points} · ${label}`

  const className = isDark
    ? tier === 'exact'
      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
      : tier === 'goal_diff'
        ? 'text-sky-400 bg-sky-950/40 border-sky-500/30'
        : tier === 'result'
          ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
          : 'text-stone-500 bg-stone-900/40 border-white/10'
    : tier === 'exact'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
      : tier === 'goal_diff'
        ? 'text-sky-700 bg-sky-50 border-sky-300'
        : tier === 'result'
          ? 'text-amber-800 bg-amber-50 border-amber-300'
          : 'text-stone-600 bg-stone-100 border-stone-200'

  return { text, className }
}

export default function PredictionCard({
  prediction,
  isDark = true,
}: {
  prediction: MatchPrediction
  isDark?: boolean
}) {
  const theme = mundialTheme(isDark)
  const settled = prediction.settledAt != null
  const badge = settled ? pointsBadge(prediction.pointsEarned, isDark) : null
  const matchDate = new Date(prediction.matchDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`rounded-xl border px-4 py-3 ${theme.cardSoft}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`text-sm leading-snug ${theme.body}`}>
          {prediction.homeTeamName}{' '}
          <strong className={`text-base tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>
            {prediction.homeScore}-{prediction.awayScore}
          </strong>{' '}
          {prediction.awayTeamName}
        </p>
        {badge && (
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>

      {settled && prediction.actualHomeScore != null && prediction.actualAwayScore != null && (
        <p className={`text-xs mb-1 ${theme.muted}`}>
          Resultado real:{' '}
          <span className={`font-semibold tabular-nums ${theme.resultText}`}>
            {prediction.actualHomeScore}-{prediction.actualAwayScore}
          </span>
        </p>
      )}

      <p className={`text-[10px] ${theme.mutedSm}`}>
        -{prediction.creditsWagered} créditos · {matchDate}
        {!settled && ' · Pendiente'}
      </p>
    </div>
  )
}

export { POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE, POINTS_CORRECT_RESULT }
