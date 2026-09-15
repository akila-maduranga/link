import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { registerSchema } from "@/lib/validators"
import { sendVerificationEmail } from "@/lib/email"
import { fail, ok } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000) // 5/hour
  if (!rl.ok) return fail("Too many registration attempts. Try again later.", 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("Invalid request body")
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return fail("An account with this email already exists", 409)

  // First registered user becomes the admin
  const userCount = await db.user.count()

  const rawToken = randomBytes(32).toString("hex")
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: userCount === 0 ? "ADMIN" : "USER",
      verifyToken: tokenHash(rawToken),
      verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastEmailSent: new Date(),
    },
    select: { id: true, role: true },
  })

  const emailResult = await sendVerificationEmail(email, name, rawToken)

  return ok({
    message:
      emailResult.delivered
        ? "Account created! Check your inbox for a verification email."
        : "Account created! Email delivery is not configured on this server yet.",
    // Only exposed when Resend is not configured, so the flow remains usable in dev
    devVerificationUrl: emailResult.delivered ? undefined : emailResult.devUrl,
    isAdmin: user.role === "ADMIN",
  })
}
