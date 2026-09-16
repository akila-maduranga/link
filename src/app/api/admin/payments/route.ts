import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fail, ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/admin/payments?source=PAYPAL|ADMIN — who paid for premium. */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source") === "ADMIN" ? "ADMIN" : searchParams.get("source") === "PAYPAL" ? "PAYPAL" : undefined
  const page = Math.max(1, Math.min(500, Number(searchParams.get("page")) || 1))
  const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize")) || 20))

  const where = source ? { source } : {}

  // Revenue over ALL PayPal payments (amount is a string column → sum in SQL).
  const [payments, total, paypalCount, revenueRows] = await Promise.all([
    db.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        orderId: true,
        payerEmail: true,
        payerName: true,
        daysGranted: true,
        source: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, premiumUntil: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.payment.count({ where }),
    db.payment.count({ where: { source: "PAYPAL" } }),
    db.$queryRaw<Array<{ total: number | null; currency: string | null }>>`
      SELECT CAST(SUM(CAST("amount" AS REAL)) AS TEXT) AS total, "currency"
      FROM "Payment" WHERE "source" = 'PAYPAL' AND "status" = 'COMPLETED'
      GROUP BY "currency"`,
  ])

  const revenue = revenueRows.map((r) => ({
    total: Number(r.total ?? 0).toFixed(2),
    currency: r.currency ?? "USD",
  }))

  return ok({
    payments: payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      user: {
        ...p.user,
        premiumUntil: p.user.premiumUntil?.toISOString() ?? null,
      },
    })),
    paypalPayments: paypalCount,
    revenue,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  })
}
