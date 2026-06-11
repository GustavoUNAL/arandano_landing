import ReglamentoPage from '@/components/sports/ReglamentoPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reglamento y condiciones | Polla Mundialista',
  description:
    'Reglamento completo de la polla mundialista Arándano 2026: créditos, puntos, ganadores, pronósticos y condiciones de participación.',
}

export default function ReglamentoRoute() {
  return <ReglamentoPage />
}
