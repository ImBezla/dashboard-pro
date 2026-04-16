const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Schlanke Production-Images & korrektes File-Tracing im npm-Workspace. */
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../..'),
  },
  async redirects() {
    return [
      {
        source: '/operations-os',
        destination: '/flow',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

