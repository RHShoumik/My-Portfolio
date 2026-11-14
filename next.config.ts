import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Old prototype paths still work.
  async redirects() {
    return [
      { source: "/plain", destination: "/", permanent: true },
      { source: "/game", destination: "/island", permanent: true },
    ];
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
