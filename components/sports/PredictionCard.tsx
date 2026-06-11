import {
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  pointsToTier,
  tierLabel,
  type MatchPrediction,
} from '@/lib/sports-polla-shared'

function pointsBadge(points: number | null) {
  if (points == null) return null
  const tier = pointsToTier(points)
  const label = tierLabel(tier)
  const text =
    points === 0 ? '0 pts' : `+${points} · ${label}`

  const className =
    tier === 'exact'
      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
      : tier === 'goal_diff'
        ? 'text-sky-400 bg-sky-950/40 border-sky-500/30'
        : tier === 'result'
          ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
          : 'text-stone-500 bg-stone-900/40 border-white/10'

  return { text, className }
}

export default function PredictionCard({ prediction }: { prediction: MatchPrediction }) {
  const settled = prediction.settledAt != null
  const badge = settled ? pointsBadge(prediction.pointsEarned) : null
  const matchDate = new Date(prediction.matchDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm text-stone-200 leading-snug">
          {prediction.homeTeamName}{' '}
          <strong className="text-berry-300 text-base tabular-nums">
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
        <p className="text-xs text-stone-400 mb-1">
          Resultado real:{' '}
          <span className="text-stone-200 font-semibold tabular-nums">
            {prediction.actualHomeScore}-{prediction.actualAwayScore}
          </span>
        </p>
      )}

      <p className="text-[10px] text-stone-500">
        -{prediction.creditsWagered} créditos · {matchDate}
        {!settled && ' · Pendiente'}
      </p>
    </div>
  )
}

export { POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE, POINTS_CORRECT_RESULT }
