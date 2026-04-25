import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  env: {
    // Expose VERCEL_URL vào client bundle để auto-detect domain
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL ?? "",
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
