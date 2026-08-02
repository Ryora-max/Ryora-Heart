import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["192.168.1.54", "http://192.168.1.54:3000"],
  async redirects() {
    return [
      { source: "/chat-room", destination: "/living-room", permanent: true },
      { source: "/voice-notes", destination: "/bedroom", permanent: true },
      { source: "/time-zone", destination: "/home", permanent: true },
      { source: "/calendar", destination: "/rooftop", permanent: true },
      { source: "/gallery", destination: "/garden", permanent: true },
      { source: "/achievements", destination: "/rooftop", permanent: true },
      { source: "/dashboard", destination: "/home", permanent: true },
    ];
  },
};

export default nextConfig;
