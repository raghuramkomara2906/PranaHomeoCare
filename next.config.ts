import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal self-contained server bundle at .next/standalone,
  // which the Docker runner stage copies. Needed for containerized deploys.
  output: "standalone",

  // Proxies API calls through this app's own origin so the admin session
  // cookie is first-party (browsers increasingly block third-party cookies
  // outright, which SameSite=None can't work around). Only active when
  // API_PROXY_TARGET is set — see .env.example.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
