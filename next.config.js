/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Remove data attributes from extensions during compilation
    removeConsole: false,
    reactRemoveProperties: process.env.NODE_ENV === 'production' 
      ? { properties: ['^data-new-gr-c-s-check-loaded$', '^data-gr-ext-installed$', '^data-gr-ext-disabled$', '^data-gr-.*$'] }
      : false
  },
  // Ignore specific build warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2
  }
}

module.exports = nextConfig 