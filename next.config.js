/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, // Habilitar optimización de imágenes
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
}

module.exports = nextConfig

