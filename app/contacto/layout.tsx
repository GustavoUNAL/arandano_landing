import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto - Arándano Café Bar',
  description: 'Contacta con Arándano Café Bar - Disponible 24/7',
}

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

