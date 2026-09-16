import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fail, ok } from "@/lib/api"
import { isPremiumActive } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/admin/stats — platform overview for the admin panel. */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const [users, links, hiddenLinks, featuredLinks, shortLinks, clicks, events, verified, premiumActive, paypalPayments, revenueRows] =
    await Promise.all([
      db.user.count(),
      db.link.count({ where: { status: "ACTIVE" } }),
      db.link.count({ where: { status: "HIDDEN" } }),
      db.link.count({ where: { featured: true } }),
      db.shortLink.count(),
      db.shortLink.aggregate({ _sum: { clicks: true } }),
      db.shortLinkEvent.count(),
      db.user.count({ where: { NOT: { emailVerified: null } } }),
      db.user.count({ where: { premiumUntil: { gt: new Date() } } }),
      db.payment.count({ where: { source: "PAYPAL" } }),
      db.$queryRaw<Array<{ total: number | null; currency: string | null }>>`
        SELECT CAST(SUM(CAST("amount" AS REAL)) AS TEXT) AS total, "currency"
        FROM "Payment" WHERE "source" = 'PAYPAL' AND "status" = 'COMPLETED'
        GROUP BY "currency"`,
    ])

  const recentUsers = await db.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true, emailVerified: true, role: true, premiumUntil: true },
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
      premiumActive,
      paypalPayments,
      revenue: revenueRows.map((r) => ({
        total: Number(r.total ?? 0).toFixed(2),
        currency: r.currency ?? "USD",
      })),
    },
    recentUsers: recentUsers.map((u) => ({
      ...u,
      premiumUntil: u.premiumUntil?.toISOString() ?? null,
      isPremium: isPremiumActive(u.premiumUntil),
    })),
    recentLinks,
  })
}
