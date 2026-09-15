/**
 * Minimal in-memory sliding-window rate limiter.
 * Suitable for a single small VPS — no external services needed.
 */

const buckets = new Map<string, number[]>()
const MAX_KEYS = 5000

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  if (buckets.size > MAX_KEYS) {
    // Prevent unbounded growth: drop stale buckets
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || hits[hits.length - 1] < windowStart) buckets.delete(k)
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    const retryAfterMs = hits[0] + windowMs - now
    return { ok: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 1000) }
  }

  hits.push(now)
  buckets.set(key, hits)
  return { ok: true, remaining: limit - hits.length, retryAfterMs: 0 }
}

export function clientIp(request: Request): string {
  const h = request.headers
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "") ||
    "unknown"
  )
}
