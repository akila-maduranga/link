import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { forgotPasswordSchema } from "@/lib/validators"
import { sendPasswordResetEmail } from "@/lib/email"
import { fail, ok } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const rl = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60 * 1000)
  if (!rl.ok) return fail("Too many requests. Try again later.", 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("Invalid request body")
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) return fail("Enter a valid email address", 422)

  const user = await db.user.findUnique({ where: { email: parsed.data.email } })

  // Always respond with the same message — never reveal whether the email exists
  const genericMessage = "If an account exists for this email, a reset link has been sent."

  if (!user || !user.emailVerified) {
    return ok({ message: genericMessage })
  }

  const rawToken = randomBytes(32).toString("hex")
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: createHash("sha256").update(rawToken).digest("hex"),
      resetTokenExp: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      lastEmailSent: new Date(),
    },
  })

  const result = await sendPasswordResetEmail(user.email, user.name, rawToken)

  return ok({
    message: genericMessage,
    devResetUrl: result.delivered ? undefined : result.devUrl,
  })
}
