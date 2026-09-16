import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { shortLinkCreateSchema } from "@/lib/validators"
import { uniqueShortCode } from "@/lib/slug"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"
import { Prisma } from "@prisma/client"
import { isPremiumActive, FREE_TRACKABLE_LIMIT } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SELECT = {
  id: true,
  slug: true,
  destination: true,
  title: true,
  description: true,
  isActive: true,
  trackable: true,
  clicks: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShortLinkSelect

/** GET /api/shortlinks — list the signed-in user's short links. */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)
  if (!session.verified) return fail("Verify your email to use the shortener", 403)

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100)
  const page = Math.max(1, Math.min(500, Number(searchParams.get("page")) || 1))
  const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize")) || 20))

  const where: Prisma.ShortLinkWhereInput = { userId: session.sub }
  if (q) {
    where.OR = [
      { slug: { contains: q } },
      { destination: { contains: q } },
      { title: { contains: q } },
    ]
  }

  const [links, total] = await Promise.all([
    db.shortLink.findMany({
      where,
      select: SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.shortLink.count({ where }),
  ])

  return ok({
    links,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  })
}

/** POST /api/shortlinks — create a shortened URL (verified users only). */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)
  if (!session.verified) return fail("Verify your email first to shorten links", 403)

  const rl = rateLimit(`shorten:${session.sub}`, 30, 60 * 60 * 1000) // 30/hour
  if (!rl.ok) return fail("Rate limit reached (30 links/hour). Try again later.", 429)

  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const parsed = shortLinkCreateSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const data = parsed.data

  // Reserved slugs
  const reserved = new Set([
    "api", "admin", "login", "register", "dashboard", "explore", "settings",
    "verify-email", "forgot-password", "reset-password", "go", "s", "link",
    "about", "help", "terms", "privacy", "health", "static", "_next", "public",
    "premium",
  ])
  if (data.customSlug && reserved.has(data.customSlug.toLowerCase())) {
    return fail("This short code is reserved", 422)
  }

  // Free-tier quota: max FREE_TRACKABLE_LIMIT short links WITH click
  // analytics. Untrackable links and community submissions stay unlimited.
  const trackable = data.trackable !== false // default: analytics on
  if (trackable) {
    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { premiumUntil: true },
    })
    if (!isPremiumActive(user?.premiumUntil)) {
      const trackableCount = await db.shortLink.count({
        where: { userId: session.sub, trackable: true },
      })
      if (trackableCount >= FREE_TRACKABLE_LIMIT) {
        return fail(
          `Free plan limit reached — ${FREE_TRACKABLE_LIMIT} trackable short links max. ` +
            "Turn off click analytics for this link, or upgrade to Premium for unlimited.",
          403,
          { code: "TRACKABLE_QUOTA", upgradeUrl: "/premium" }
        )
      }
    }
  }

  try {
    const slug = await uniqueShortCode(data.customSlug || undefined)
    const link = await db.shortLink.create({
      data: {
        slug,
        destination: data.destination,
        title: data.title || null,
        description: data.description || null,
        trackable,
        userId: session.sub,
      },
      select: SELECT,
    })
    return ok({ link, message: "Short link created!" }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "TAKEN") {
      return fail("This custom short code is already taken", 409)
    }
    console.error("[shortlinks] create failed:", err)
    return fail("Could not create the short link. Try again.", 500)
  }
}
