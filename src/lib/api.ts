import { NextResponse } from "next/server"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

export function getBaseUrl(request?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "")
  if (request) {
    try {
      const url = new URL(request.url)
      const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host
      return `${proto}://${host}`
    } catch {
      /* ignore */
    }
  }
  return "http://localhost:3000"
}

/**
 * Country lookup from standard proxy/CDN headers (zero memory, no GeoIP file).
 * Works out of the box behind Cloudflare ("IP Geolocation" enabled) and most proxies.
 */
export function countryFromHeaders(request: Request): string | null {
  const h = request.headers
  const raw =
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    h.get("x-country-code") ||
    h.get("x-geo-country") ||
    null
  if (!raw || raw === "XX" || raw === "T1") return null
  if (raw.length !== 2) return null
  return raw.toUpperCase()
}
