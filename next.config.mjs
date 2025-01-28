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
    // Ensure proper static file handling
    distDir: '.next',
    // Ensure proper output configuration
    outputFileTracing: true,
    outputStandalone: true,
    generateBuildId: async () => {
      return 'build'
    },
    // Ensure server file is generated
    generateEtags: false,
}

export default nextConfig;
  
  