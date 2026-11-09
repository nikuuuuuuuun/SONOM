import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Necesario para la imagen Docker de producción (Dockerfile.storefront)
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async redirects() {
    return [
      {
        source: '/carrito',
        destination: '/cart',
        permanent: true,
      },
      {
        source: '/carrito/:path*',
        destination: '/cart/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
