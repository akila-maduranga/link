/**
 * IP → country resolution for click analytics.
 *
 * Why this exists: `countryFromHeaders()` only reads proxy/CDN headers
 * (CF-IPCountry etc.), which are absent when the site is served directly by
 * the built-in Caddy proxy — every click therefore stored `country: null`
 * and the analytics page showed "Unknown" for everyone.
 *
 * Resolution layers (cheapest first):
 *   1. CDN/proxy headers — handled by the caller (lib/api.ts), instant & exact
 *   2. In-process cache — repeat visitors cost zero API calls
 *   3. External keyless GeoIP APIs — tried in order until one answers:
 *        a. geojs.io    — free, HTTPS, no key, no rate limit (primary)
 *        b. ipwho.is    — free, HTTPS, ~10k requests/month (fallback)
 *        c. ip-api.com  — free non-commercial, HTTP only, 45 req/min (last resort)
 *
 * Guards: private/reserved IPs never hit the network; a process-wide
 * 40 lookups/min cap keeps us inside every provider's fair-use policy even
 * under bot swarms; each request has a hard timeout; failures are
 * negative-cached for 10 minutes so a flaky provider is not retried to death.
 *
 * Privacy: raw IPs are never stored (only the salted hash in ShortLinkEvent);
 * the IP is sent to the lookup provider transiently, same as any web request
 * the visitor makes to an external site. Set GEOIP=off in .env to disable
 * the external lookups entirely (clicks then record no country).
 */
import { isIP } from "net"
import { rateLimit } from "@/lib/rate-limit"

const CACHE_MAX = 4096
const POSITIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — IP geolocation rarely changes
const NEGATIVE_TTL_MS = 10 * 60 * 1000 // 10 min — failed lookups retry soon, not never
const LOOKUPS_PER_MIN = 40 // below ip-api's 45/min; geojs/ipwho.is never see a burst
const REQUEST_TIMEOUT_MS = 3500

interface CacheEntry {
  country: string | null
  exp: number
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<string | null>>()

/** GEOIP=off (any case) in .env disables all external lookups. */
export function geoipEnabled(): boolean {
  return (process.env.GEOIP || "").trim().toLowerCase() !== "off"
}

/**
 * Private / reserved / non-routable addresses (RFC1918, loopback, CGNAT,
 * link-local, multicast…) can never be geolocated — skip the network call.
 * Only well-formed IPv4/IPv6 literals ever reach this function.
 */
function isPrivateOrReserved(ip: string): boolean {
  if (isIP(ip) === 6) {
    const low = ip.toLowerCase()
    // ::1 loopback, unspecified, fe80::/10 link-local, fc00::/7 ULA,
    // ::ffff:0:0/96 IPv4-mapped (covers the v4 private ranges too)
    return (
      low === "::1" ||
      low === "::" ||
      low.startsWith("fe80:") ||
      low.startsWith("fc") ||
      low.startsWith("fd") ||
      low.startsWith("::ffff:")
    )
  }
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return true // not an IPv4 literal → not worth an API call
  const a = Number(m[1])
  const b = Number(m[2])
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast + reserved
  )
}

/**
 * Only strict IPv4/IPv6 literals (per net.isIP) may be looked up. This also
 * makes the literal URL-safe by construction (hex digits, dots, colons —
 * nothing an XFF header could smuggle in), so providers receive the RAW
 * literal: geojs cannot resolve percent-encoded IPv6 colons.
 */
function isLookupableIp(ip: string): boolean {
  return (
    !!ip &&
    ip !== "unknown" &&
    !ip.includes("%") && // IPv6 zone IDs (fe80::1%eth0) are link-local anyway
    /^[0-9a-fA-F:.]+$/.test(ip) &&
    (isIP(ip) === 4 || isIP(ip) === 6)
  )
}

function validCountry(code: unknown): code is string {
  return typeof code === "string" && /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1"
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "user-agent": "findlink-geoip/1.0" },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Provider chain: keyless, free, country-level accuracy ≥99% when healthy. */
const PROVIDERS: Array<{ url: (ip: string) => string; extract: (json: unknown) => string | null }> = [
  {
    // {"ip":"8.8.8.8","country":"US","country_3":"USA","name":"United States"}
    url: (ip) => `https://get.geojs.io/v1/ip/country/${ip}.json`,
    extract: (json) => {
      const j = json as Record<string, unknown> | null
      return j && validCountry(j.country) ? j.country : null
    },
  },
  {
    // {"ip":"8.8.8.8","success":true,"country_code":"US",...}
    url: (ip) => `https://ipwho.is/${ip}`,
    extract: (json) => {
      const j = json as Record<string, unknown> | null
      return j && j.success !== false && validCountry(j.country_code) ? j.country_code : null
    },
  },
  {
    // {"status":"success","countryCode":"US"} — HTTP only on the free tier.
    // Kept LAST: measured to mislabel some IPv6 ranges (CA for a Google IP).
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,countryCode`,
    extract: (json) => {
      const j = json as Record<string, unknown> | null
      return j && j.status === "success" && validCountry(j.countryCode) ? j.countryCode : null
    },
  },
]

function remember(ip: string, country: string | null) {
  if (cache.size >= CACHE_MAX) {
    // Cheap eviction: Map preserves insertion order — drop the oldest quarter.
    let drop = Math.ceil(CACHE_MAX / 4)
    for (const key of cache.keys()) {
      if (drop-- <= 0) break
      cache.delete(key)
    }
  }
  cache.set(ip, { country, exp: Date.now() + (country ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS) })
}

async function doLookup(ip: string): Promise<string | null> {
  if (!isLookupableIp(ip) || isPrivateOrReserved(ip)) return null

  // Politeness guard: a bot swarm of unique IPs must not hammer the free
  // APIs. Cached IPs bypass this entirely (checked by the caller's wrapper).
  if (!rateLimit("geoip:lookups", LOOKUPS_PER_MIN, 60 * 1000).ok) return null

  for (const provider of PROVIDERS) {
    try {
      const country = provider.extract(await fetchJson(provider.url(ip)))
      if (country) {
        remember(ip, country)
        return country
      }
    } catch {
      // network error / timeout / bad payload → try the next provider
    }
  }
  remember(ip, null)
  return null
}

/**
 * Resolve an IP to an ISO-3166 alpha-2 country code, or null when it cannot
 * be determined. Concurrent calls for the same IP share one request.
 */
export function lookupCountry(ip: string): Promise<string | null> {
  if (!geoipEnabled() || !isLookupableIp(ip) || isPrivateOrReserved(ip)) {
    return Promise.resolve(null)
  }

  const cached = cache.get(ip)
  if (cached && cached.exp > Date.now()) return Promise.resolve(cached.country)

  const inFlight = pending.get(ip)
  if (inFlight) return inFlight

  const p = doLookup(ip).finally(() => pending.delete(ip))
  pending.set(ip, p)
  return p
}
