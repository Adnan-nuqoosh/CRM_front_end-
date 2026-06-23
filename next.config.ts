import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: false,
  },
  images: { unoptimized: true },
};

export default nextConfig;