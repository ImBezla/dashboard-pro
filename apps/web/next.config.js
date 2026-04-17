const path = require('path');

const dockerLowMem = process.env.DOCKER_LOW_MEM === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Docker-Build: siehe SKIP_NEXT_LINT in docker/Dockerfile.web — Lint läuft in CI (`npm run lint`). */
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_NEXT_LINT === '1',
  },
  /** Keine Browser-Sourcemaps in Produktion (weniger Code-Leakage). */
  productionBrowserSourceMaps: false,
  /** Schlanke Production-Images & korrektes File-Tracing im npm-Workspace. */
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../..'),
    ...(dockerLowMem
      ? {
          cpus: 1,
          webpackBuildWorker: true,
        }
      : {}),
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

