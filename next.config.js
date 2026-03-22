/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Docker multi-stage build (standalone server.js)
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
