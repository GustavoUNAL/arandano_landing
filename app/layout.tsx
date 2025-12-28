import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arándano Café Bar - Café de día · Servicio de bebidas 24/7',
  description: 'Arándano Café Bar en Pasto, Colombia. Zona universitaria. Abierto 24/7. Café, snacks y servicio de bebidas.',
  keywords: 'café, pasto, colombia, zona universitaria, 24/7, bebidas, snacks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}

