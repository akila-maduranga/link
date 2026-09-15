import type { NextConfig } from "next";

/**
 * FindLink — build configuration tuned for low-memory (512 MB) VPS builds.
 *
 * - output "standalone": minimal traced runtime image.
 * - typescript.ignoreBuildErrors: tsc is the single biggest memory spike of
 *   `next build`; types are checked during development instead.
 * - experimental.turbopackMemoryLimit: hard guardrail for the Turbopack
 *   (Rust) build process, in MB. When exceeded the build FAILS with a clear
 *   error instead of thrashing swap for an hour (which looks like a hang).
 *   Only set when TURBOPACK_MEMORY_LIMIT is present in the environment —
 *   e.g. in the Docker builder stage. CI builders with ample RAM leave it
 *   unset (no limit).
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  ...(process.env.TURBOPACK_MEMORY_LIMIT
    ? {
        experimental: {
          turbopackMemoryLimit: Number(process.env.TURBOPACK_MEMORY_LIMIT),
        },
      }
    : {}),
};

export default nextConfig;
