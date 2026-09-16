import { NextResponse } from "next/server"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

/** Thrown by readJsonBody when a payload exceeds the limit (DoS guard for the 512 MB VPS). */
export class BodyTooLargeError extends Error {}

/**
 * Parse a JSON request body with a hard size cap. Next route handlers apply NO
 * default body limit — without this, a single oversized POST could exhaust the
 * container's memory before zod ever sees the payload. Every schema in this
 * app is < 2 KB, so 32 KB is generous headroom.
 */
export async function readJsonBody(request: Request, maxBytes = 32 * 1024): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") || 0)
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError()
  const text = await request.text() // also covers chunked bodies without content-length
  if (text.length > maxBytes) throw new BodyTooLargeError()
  return JSON.parse(text)
}

/**
 * Only ever redirect to absolute http(s) URLs — never javascript:, data: or
 * other schemes. URLs are validated on submission, but this re-check at
 * redirect time protects against legacy/edited DB rows (defense in depth,
 * OWASP A01:2021 – Unvalidated Redirects).
 */
export function safeExternalUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return raw
  } catch {
    return null
  }
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
