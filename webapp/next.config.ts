import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [], // not needed for local images
  },
  eslint: {
    ignoreDuringBuilds: true, // skip ESLint errors during build
  },
};

module.exports = nextConfig;
