import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal self-contained server bundle at .next/standalone,
  // which the Docker runner stage copies. Needed for containerized deploys.
  output: "standalone",
};

export default nextConfig;
