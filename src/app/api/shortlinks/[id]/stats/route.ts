import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fail, ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface DayRow { day: string; count: bigint }
interface GroupRow { value: string | null; count: bigint }

/** GET /api/shortlinks/:id/stats?range=7d|30d|90d|all — detailed click analytics. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const link = await db.shortLink.findUnique({
    where: { id },
    select: { id: true, userId: true, slug: true, clicks: true, createdAt: true, trackable: true },
  })
  if (!link) return fail("Short link not found", 404)
  if (link.userId !== session.sub && session.role !== "ADMIN") {
    return fail("Not your short link", 403)
  }
  if (!link.trackable) {
    // Free-tier untrackable link — created without analytics on purpose.
    return fail("Analytics are disabled for this short link", 403, { code: "NOT_TRACKABLE" })
  }

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get("range") ?? "30d"
  const days = rangeParam === "7d" ? 7 : rangeParam === "90d" ? 90 : rangeParam === "all" ? 3650 : 30
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000

  // NOTE: Prisma stores DateTime as epoch MILLISECONDS in SQLite.
  const [series, countries, browsers, oses, devices, referrers, totals] = await Promise.all([
    db.$queryRaw<DayRow[]>`
      SELECT strftime('%Y-%m-%d', "createdAt"/1000, 'unixepoch') AS day, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY day ORDER BY day`,
    db.$queryRaw<GroupRow[]>`
      SELECT "country" AS value, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY value ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<GroupRow[]>`
      SELECT "browser" AS value, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY value ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<GroupRow[]>`
      SELECT "os" AS value, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY value ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<GroupRow[]>`
      SELECT "device" AS value, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY value ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<GroupRow[]>`
      SELECT "referrer" AS value, COUNT(*) AS count
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}
      GROUP BY value ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<{
      clicks: bigint
      uniques: bigint
      bots: bigint
    }[]>`
      SELECT COUNT(*) AS clicks,
             COUNT(DISTINCT "ipHash") AS uniques,
             SUM(CASE WHEN "isBot" = 1 THEN 1 ELSE 0 END) AS bots
      FROM "ShortLinkEvent"
      WHERE "shortLinkId" = ${link.id} AND "createdAt" >= ${sinceMs}`,
  ])

  // Fill missing days so the chart is continuous
  const seriesMap = new Map(series.map((r) => [r.day, Number(r.count)]))
  const filled: { day: string; count: number }[] = []
  const totalDays = Math.min(days, 90)
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    filled.push({ day: key, count: seriesMap.get(key) ?? 0 })
  }

  const t = totals[0] ?? { clicks: BigInt(0), uniques: BigInt(0), bots: BigInt(0) }

  return ok({
    range: rangeParam,
    totals: {
      clicks: Number(t.clicks),
      unique: Number(t.uniques),
      bots: Number(t.bots),
      allTime: link.clicks,
    },
    series: filled,
    countries: countries.map((r) => ({ value: r.value ?? "Unknown", count: Number(r.count) })),
    browsers: browsers.map((r) => ({ value: r.value ?? "Unknown", count: Number(r.count) })),
    oses: oses.map((r) => ({ value: r.value ?? "Unknown", count: Number(r.count) })),
    devices: devices.map((r) => ({ value: r.value ?? "Unknown", count: Number(r.count) })),
    referrers: referrers.map((r) => ({ value: r.value ?? "Direct", count: Number(r.count) })),
  })
}
