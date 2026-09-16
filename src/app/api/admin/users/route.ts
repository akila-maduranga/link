import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fail, ok } from "@/lib/api"
import { isPremiumActive } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  premiumUntil: true,
  createdAt: true,
} as const

/** GET /api/admin/users?q= — searchable user list with premium state. */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100)
  const page = Math.max(1, Math.min(500, Number(searchParams.get("page")) || 1))
  const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize")) || 20))

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])

  return ok({
    users: users.map((u) => ({
      ...u,
      premiumUntil: u.premiumUntil?.toISOString() ?? null,
      isPremium: isPremiumActive(u.premiumUntil),
    })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  })
}
