import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"

// Unambiguous alphabet (no 0/O, 1/l/I) — 58 chars, ~5.8 bits of entropy per char.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"

export function randomCode(length = 6): string {
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  return base || "link"
}

/** Generate a unique SEO slug for a directory link. */
export async function uniqueLinkSlug(title: string): Promise<string> {
  const base = slugify(title)
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomCode(4).toLowerCase()}`
    const existing = await db.link.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
  }
  return `${base}-${randomCode(8).toLowerCase()}`
}

/** Generate a unique short code for a shortened URL. */
export async function uniqueShortCode(custom?: string): Promise<string> {
  if (custom) {
    const existing = await db.shortLink.findUnique({ where: { slug: custom }, select: { id: true } })
    if (existing) throw new Error("TAKEN")
    return custom
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = randomCode(attempt < 2 ? 5 : 6)
    const existing = await db.shortLink.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
  }
  throw new Error("GENERATION_FAILED")
}

/** Salted hash of an IP address for privacy-preserving unique-visitor stats. */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET || "findlink"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)
}

/** Extract the registrable domain from a referrer URL. */
export function referrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 100)
  } catch {
    return null
  }
}
