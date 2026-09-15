import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { loginSchema } from "@/lib/validators"
import { setSessionCookie } from "@/lib/auth"
import { fail, ok } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const rl = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000) // 10 per 10 min
  if (!rl.ok) return fail("Too many login attempts. Try again later.", 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("Invalid request body")
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const { email, password } = parsed.data

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("Invalid email or password", 401)
  }

  await setSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    verified: Boolean(user.emailVerified),
  })

  return ok({
    message: "Signed in",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: Boolean(user.emailVerified),
    },
  })
}
