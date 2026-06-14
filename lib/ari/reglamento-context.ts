import {
  CONDICIONES_LEGALES,
  GROUP_STAGE_PRIZES,
  INITIAL_CREDITS,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PRIZES_NOTE,
  POLL_NAME,
  REGLAMENTO_SECTIONS,
  REGLAMENTO_SHORT,
  SCORING_EXAMPLES,
} from '@/lib/polla-rules'

/** Reglamento completo en texto compacto — fuente única para Predictor. */
export function buildReglamentoContext(): string {
  const sections = REGLAMENTO_SECTIONS.map(
    (s) => `### ${s.title}\n${s.items.map((i) => `• ${i}`).join('\n')}`
  ).join('\n\n')

  const legales = CONDICIONES_LEGALES.map(
    (s) => `### ${s.title}\n${s.items.map((i) => `• ${i}`).join('\n')}`
  ).join('\n\n')

  const ejemplos = SCORING_EXAMPLES.map(
    (e) =>
      `• ${e.label}: pronóstico ${e.predictionHome}-${e.predictionAway}, resultado ${e.resultHome}-${e.resultAway} → ${e.points} pt`
  ).join('\n')

  const premiosGrupos = GROUP_STAGE_PRIZES.map((p) => `• ${p.place}: ${p.prize}`).join('\n')

  return [
    `JUEGO: ${POLL_NAME}`,
    `RESUMEN: ${REGLAMENTO_SHORT}`,
    `CRÉDITOS INICIALES: ${INITIAL_CREDITS.toLocaleString('es-CO')}`,
    `PASAPORTE ELIMINATORIAS: ${KNOCKOUT_PASSPORT_LABEL}`,
    `PREMIOS GRUPOS:\n${premiosGrupos}`,
    `ELIMINATORIAS: ${KNOCKOUT_PRIZES_NOTE}`,
    sections,
    '### Ejemplos de puntuación',
    ejemplos,
    '### Condiciones legales',
    legales,
  ].join('\n\n')
}
