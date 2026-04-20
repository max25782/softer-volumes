import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // framer-motion is omitted: barrel optimization can break its module graph in Next 15 + webpack.
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
