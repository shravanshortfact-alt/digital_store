import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['100.101.251.55', '192.168.1.34'],
};

export default async () => {
  if (process.env.NODE_ENV === "development") {
    await setupDevPlatform();
  }
  return nextConfig;
};
