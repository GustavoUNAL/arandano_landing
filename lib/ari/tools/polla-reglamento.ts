import { buildReglamentoContext } from '@/lib/ari/reglamento-context'

export function getPollaReglamento() {
  return {
    source: 'polla-rules.ts',
    content: buildReglamentoContext(),
  }
}
