import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Menú de Cafés & Snacks - Arándano Café Bar',
  description: 'Consulta nuestro menú de cafés de especialidad y deliciosos snacks disponibles en Arándano Café Bar.',
}

export default function MenuCafesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

