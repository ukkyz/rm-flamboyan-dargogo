import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 adalah native module — jangan di-bundle oleh Turbopack/Webpack
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
