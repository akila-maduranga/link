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
 * - poweredByHeader: no "X-Powered-By: Next.js" disclosure (OWASP A05).
 * - headers(): static OWASP secure-headers baseline for EVERY response
 *   (incl. immutable assets that skip middleware). The nonce-based CSP,
 *   HSTS and COOP are set per-request in src/middleware.ts — keep the two
 *   lists disjoint so headers are never duplicated.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  reactStrictMode: false,
  // Dev only: the sandbox/browser reaches the dev server via 127.0.0.1 while
  // it listens on localhost — Next 16 blocks "cross-origin" dev resources
  // (HMR socket) otherwise, which silently prevents hydration. No effect on
  // production builds.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  ...(process.env.TURBOPACK_MEMORY_LIMIT
    ? {
        experimental: {
          turbopackMemoryLimit: Number(process.env.TURBOPACK_MEMORY_LIMIT),
        },
      }
    : {}),
};

export default nextConfig;
