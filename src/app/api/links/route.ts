import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { linkSubmitSchema } from "@/lib/validators"
import { uniqueLinkSlug } from "@/lib/slug"
import { fail, ok } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_SORTS = ["new", "popular", "featured"] as const
type Sort = (typeof VALID_SORTS)[number]

const LINK_SELECT = {
  id: true,
  slug: true,
  title: true,
  url: true,
  description: true,
  platform: true,
  category: true,
  country: true,
  language: true,
  members: true,
  featured: true,
  status: true,
  views: true,
  clicks: true,
  createdAt: true,
  user: { select: { name: true } },
} satisfies Prisma.LinkSelect

/** GET /api/links — public directory with filters, search, sorting, pagination. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100)
  const platform = searchParams.get("platform") ?? ""
  const category = searchParams.get("category") ?? ""
  const country = searchParams.get("country") ?? ""
  const language = searchParams.get("language") ?? ""
  const sortParam = searchParams.get("sort") ?? "new"
  const sort: Sort = (VALID_SORTS as readonly string[]).includes(sortParam)
    ? (sortParam as Sort)
    : "new"
  const page = Math.max(1, Math.min(500, Number(searchParams.get("page")) || 1))
  const pageSize = Math.max(1, Math.min(48, Number(searchParams.get("pageSize")) || 12))
  const mine = searchParams.get("mine") === "1"

  const where: Prisma.LinkWhereInput = {}

  if (mine) {
    // The user's own links (including hidden ones)
    const session = await getSession()
    if (!session) return fail("You need to be signed in", 401)
    where.userId = session.sub
  } else {
    where.status = "ACTIVE"
  }

  if (platform) where.platform = platform
  if (category) where.category = category
  if (country) where.country = country
  if (language) where.language = language
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const orderBy: Prisma.LinkOrderByWithRelationInput =
    sort === "popular"
      ? { clicks: "desc" }
      : sort === "featured"
        ? [{ featured: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" }

  const [links, total] = await Promise.all([
    db.link.findMany({
      where,
      select: LINK_SELECT,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.link.count({ where }),
  ])

  return ok({
    links,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

/** POST /api/links — submit a social group/channel link (verified users only). */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)
  if (!session.verified) return fail("Verify your email first to submit links", 403)

  const rl = rateLimit(`submit:${session.sub}`, 10, 24 * 60 * 60 * 1000) // 10/day
  if (!rl.ok) return fail("Daily submission limit reached (10 per day)", 429)

  const globalRl = rateLimit(`submit-ip:${clientIp(request)}`, 30, 60 * 60 * 1000)
  if (!globalRl.ok) return fail("Too many submissions from this IP. Try again later.", 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("Invalid request body")
  }

  const parsed = linkSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const data = parsed.data

  // Basic duplicate check: same URL by the same user
  const normalizedUrl = data.url.replace(/\/+$/, "")
  const duplicate = await db.link.findFirst({
    where: { userId: session.sub, url: { contains: normalizedUrl } },
    select: { id: true },
  })
  if (duplicate) return fail("You have already submitted this link", 409)

  const slug = await uniqueLinkSlug(data.title)

  const link = await db.link.create({
    data: {
      slug,
      title: data.title,
      url: data.url,
      description: data.description || null,
      platform: data.platform,
      category: data.category,
      country: data.country,
      language: data.language,
      members: data.members || null,
      userId: session.sub,
    },
    select: LINK_SELECT,
  })

  return ok({ link, message: "Link published to the directory!" }, { status: 201 })
}
