import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda Virtual - Arándano Café Bar',
  description: 'Tienda virtual de Arándano Café Bar - Próximamente',
}

export default function TiendaVirtualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

