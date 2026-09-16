import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ok } from "@/lib/api"
import { isPremiumActive, FREE_TRACKABLE_LIMIT } from "@/lib/premium"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return ok({ user: null })

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      premiumUntil: true,
    },
  })
  if (!user) return ok({ user: null })

  const premium = isPremiumActive(user.premiumUntil)
  const trackableUsed = await db.shortLink.count({
    where: { userId: session.sub, trackable: true },
  })

  return ok({
    user: {
      ...user,
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      isPremium: premium,
      // null = unlimited (premium); number = free-tier cap
      trackableUsed,
      trackableLimit: premium ? null : FREE_TRACKABLE_LIMIT,
    },
  })
}
