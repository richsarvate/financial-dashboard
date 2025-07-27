/** @type {import('next').NextConfig} */
const nextConfig = {
  // App router is now stable in Next.js 14
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress Plaid script duplication warnings in development
      config.stats = {
        warningsFilter: [
          /link-initialize.js.*embedded more than once/,
        ],
      }
    }
    return config
  },
}

module.exports = nextConfig;
