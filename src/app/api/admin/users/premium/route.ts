import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"
import { isPremiumActive, nextPremiumUntil, premiumDays } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/users/premium { userId, action: "grant"|"revoke", days? }
 *
 * Admin ability to manually grant (default 30 days, custom 1–3650) or revoke
 * premium. Grants are recorded as Payment rows with source=ADMIN so the
 * payments history stays a complete audit trail of who has premium and why.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const rl = rateLimit(`admin-premium:${session.sub}`, 60, 60 * 60 * 1000) // 60/hour
  if (!rl.ok) return fail("Too many changes — slow down.", 429)

  let body: { userId?: unknown; action?: unknown; days?: unknown }
  try {
    body = (await readJsonBody(request)) as typeof body
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : ""
  const action = typeof body.action === "string" ? body.action : ""
  if (!userId || (action !== "grant" && action !== "revoke")) {
    return fail("Expected { userId, action: 'grant' | 'revoke' }", 422)
  }

  const days =
    action === "grant"
      ? Math.max(1, Math.min(3650, Number(body.days) || premiumDays()))
      : 0

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, premiumUntil: true, role: true },
  })
  if (!user) return fail("User not found", 404)

  if (action === "revoke") {
    if (!user.premiumUntil) return fail("This user has no premium to revoke", 409)
    const updated = await db.user.update({
      where: { id: userId },
      data: { premiumUntil: null },
      select: { id: true, premiumUntil: true },
    })
    console.log(`[admin] premium revoked: ${user.email} by ${session.email}`)
    return ok({
      // Admin accounts stay premium via their role — revoke only clears the grant.
      user: { id: updated.id, premiumUntil: null, isPremium: isPremiumActive(null, user.role) },
      message: `Premium revoked for ${user.email}`,
    })
  }

  // Grant: stack onto current expiry; audit row with source=ADMIN.
  const until = nextPremiumUntil(user.premiumUntil, days)
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { premiumUntil: until },
      select: { id: true, premiumUntil: true },
    })
    await tx.payment.create({
      data: {
        userId,
        orderId: `admin-${crypto.randomUUID()}`,
        amount: "0.00",
        currency: "USD",
        status: "COMPLETED",
        payerName: session.name,
        daysGranted: days,
        source: "ADMIN",
      },
    })
    return u
  })

  console.log(
    `[admin] premium granted: ${user.email} +${days}d (until ${until.toISOString()}) by ${session.email}` +
      (isPremiumActive(user.premiumUntil, user.role) ? " [extended]" : "")
  )

  return ok({
    user: { id: updated.id, premiumUntil: until.toISOString(), isPremium: true },
    message: `${user.email} is premium until ${until.toISOString().slice(0, 10)}`,
  })
}
