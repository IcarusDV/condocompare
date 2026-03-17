/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone' only needed for Docker deploys, Vercel handles this natively
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
