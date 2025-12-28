import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Menú de Bebidas - Arándano Café Bar',
  description: 'Consulta nuestro menú completo de bebidas disponibles 24/7 en Arándano Café Bar.',
}

export default function MenuBebidasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

