import { NextRequest, NextResponse } from "next/server"

/**
 * FindLink security proxy (Next.js 16 `proxy` convention, formerly middleware)
 * — OWASP Secure Headers Project baseline.
 *
 * 1. Content-Security-Policy with a per-request nonce ('strict-dynamic'):
 *    - Next.js reads the CSP from the REQUEST headers and automatically
 *      stamps the nonce onto its bootstrap scripts AND <next/script> tags
 *      (including the inline Google Analytics config), so GA keeps working
 *      without 'unsafe-eval'.
 *    - 'unsafe-inline' is a FALLBACK only: CSP2+ browsers ignore it whenever
 *      'strict-dynamic' + a nonce are present (legacy-browser compat).
 * 2. HSTS, COOP (set only here — static headers that do not need a nonce
 *    live in next.config.ts `headers()` to avoid duplicated directives).
 *
 * Full static baseline (X-Content-Type-Options, X-Frame-Options,
 * Referrer-Policy, Permissions-Policy) is emitted by next.config.ts.
 */

const GA_SCRIPT_HOSTS = "https://www.googletagmanager.com"
const GA_IMG_SRC = "https://www.google-analytics.com https://*.googletagmanager.com"
const GA_CONNECT_SRC =
  "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com"

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const isDev = process.env.NODE_ENV !== "production"

  const csp = isDev
    ? [
        "default-src 'self'",
        // Dev needs eval (React Refresh) + inline + HMR websocket
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self'",
        "connect-src 'self' ws: http: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; ")
    : [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${GA_SCRIPT_HOSTS}`,
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: ${GA_IMG_SRC}`,
        "font-src 'self'",
        `connect-src 'self' ${GA_CONNECT_SRC}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join("; ")

  // Next.js picks the nonce out of the REQUEST CSP header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  if (!isDev) {
    // Honored only over HTTPS; safe behind the Caddy TLS proxy.
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  return response
}

export const config = {
  // Skip immutable static assets (no nonce needed there);
  // their security headers come from next.config.ts
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
