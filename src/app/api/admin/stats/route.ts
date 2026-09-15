import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fail, ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/admin/stats — platform overview for the admin panel. */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const [users, links, hiddenLinks, featuredLinks, shortLinks, clicks, events, verified] =
    await Promise.all([
      db.user.count(),
      db.link.count({ where: { status: "ACTIVE" } }),
      db.link.count({ where: { status: "HIDDEN" } }),
      db.link.count({ where: { featured: true } }),
      db.shortLink.count(),
      db.shortLink.aggregate({ _sum: { clicks: true } }),
      db.shortLinkEvent.count(),
      db.user.count({ where: { NOT: { emailVerified: null } } }),
    ])

  const recentUsers = await db.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true, emailVerified: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  const recentLinks = await db.link.findMany({
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      featured: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  return ok({
    totals: {
      users,
      verified,
      links,
      hiddenLinks,
      featuredLinks,
      shortLinks,
      clicks: clicks._sum.clicks ?? 0,
      events,
    },
    recentUsers,
    recentLinks,
  })
}
