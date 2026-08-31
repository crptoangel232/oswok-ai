import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Termux exposes the dev server on the phone's LAN address.
  // Allow the current development origin so Next.js HMR resources are not blocked.
  allowedDevOrigins: ["192.168.1.67"],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
