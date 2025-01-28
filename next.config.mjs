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
    },
    experimental: {
      serverActions: true,
    },
  }
  
  export default nextConfig;
  
  