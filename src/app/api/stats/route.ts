import { db } from "@/lib/db"
import { ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/stats — public platform stats for the landing page. */
export async function GET() {
  const [links, shortLinks, clicks, countries, users] = await Promise.all([
    db.link.count({ where: { status: "ACTIVE" } }),
    db.shortLink.count(),
    db.shortLink.aggregate({ _sum: { clicks: true } }),
    db.link.findMany({
      where: { status: "ACTIVE" },
      select: { country: true },
      distinct: ["country"],
    }),
    db.user.count(),
  ])

  return ok({
    links,
    shortLinks,
    clicks: clicks._sum.clicks ?? 0,
    countries: countries.length,
    users,
  })
}
