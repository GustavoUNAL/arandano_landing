/** @type {import('next').NextConfig} */
const path = require('path')
const { loadEnvFile } = require('./scripts/load-env-local')

const rootEnv = loadEnvFile(path.join(__dirname, '.env.local'))
const vapidPublic =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  rootEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  rootEnv.VAPID_PUBLIC_KEY ||
  ''

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublic,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, // Habilitar optimización de imágenes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Optimizaciones para build más rápido
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimizar compilación
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Optimizaciones para producción
  output: 'standalone', // Genera build optimizado para servidores
  poweredByHeader: false, // Remover header X-Powered-By
  compress: true, // Habilitar compresión Gzip
  async redirects() {
    return [
      { source: '/sports', destination: '/mundial', permanent: true },
      { source: '/sports/reglamento', destination: '/mundial/reglamento', permanent: true },
      { source: '/favicon.ico', destination: '/favicon-32.png', permanent: true },
    ]
  },
}

module.exports = nextConfig

