import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ok } from "@/lib/api"

export const runtime = "nodejs"

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
    },
  })

  return ok({ user })
}
