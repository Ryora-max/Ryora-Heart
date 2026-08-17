import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
