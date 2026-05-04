import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Next/Image to optimise the live Fortnite-API artwork
    // instead of falling back to `unoptimized`.
    remotePatterns: [
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: '**.fortnite-api.com' },
    ],
  },
};

export default nextConfig;
