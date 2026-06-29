import {
  CONDICIONES_LEGALES,
  GROUP_STAGE_PRIZES,
  INITIAL_CREDITS,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  KNOCKOUT_PRIZES_NOTE,
  PASSPORT_PURCHASE_STEPS,
  POLL_NAME,
  PRIZE_CLAIM_RULES,
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
    `PASAPORTE POLLA FINAL: ${KNOCKOUT_PASSPORT_LABEL} (${KNOCKOUT_PASSPORT_PRICE_LABEL}). Octavos/dieciseisavos solo entrenamiento; desde cuartos cuenta la polla final.`,
    `COMPRA PASAPORTE:\n${PASSPORT_PURCHASE_STEPS.map((s) => `• ${s}`).join('\n')}`,
    `COBRO PREMIOS:\n${PRIZE_CLAIM_RULES.map((r) => `• ${r}`).join('\n')}`,
    `PREMIOS GRUPOS:\n${premiosGrupos}`,
    `ELIMINATORIAS: ${KNOCKOUT_PRIZES_NOTE}`,
    sections,
    '### Ejemplos de puntuación',
    ejemplos,
    '### Condiciones legales',
    legales,
  ].join('\n\n')
}
