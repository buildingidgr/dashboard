/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'maps.googleapis.com',
          pathname: '/maps/api/staticmap/**',
        },
      ],
      unoptimized: true,
    },
    experimental: {
      serverActions: true,
    },
    // Disable powered by header
    poweredByHeader: false,
}

export default nextConfig;
  
  