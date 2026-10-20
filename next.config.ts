import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  agentRules: false,
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
