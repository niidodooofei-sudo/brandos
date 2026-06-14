import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas', 'sharp', 'pdf-parse'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
