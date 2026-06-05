import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import SiteAnalytics from '@/components/SiteAnalytics'
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: '#7c2d12',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arándano Café Bar',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon-32.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <SiteAnalytics />
          {children}
        </Suspense>
      </body>
    </html>
  )
}

