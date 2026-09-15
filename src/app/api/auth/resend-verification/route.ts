import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email"
import { fail, ok } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RESEND_COOLDOWN_MS = 60 * 1000

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const rl = rateLimit(`resend:${clientIp(request)}:${session.sub}`, 3, 10 * 60 * 1000)
  if (!rl.ok) return fail("Please wait a minute before requesting another email", 429)

  const user = await db.user.findUnique({ where: { id: session.sub } })
  if (!user) return fail("Account not found", 404)
  if (user.emailVerified) return fail("Your email is already verified", 400)

  if (user.lastEmailSent && Date.now() - user.lastEmailSent.getTime() < RESEND_COOLDOWN_MS) {
    return fail("Please wait a minute before requesting another email", 429)
  }

  const rawToken = randomBytes(32).toString("hex")
  await db.user.update({
    where: { id: user.id },
    data: {
      verifyToken: createHash("sha256").update(rawToken).digest("hex"),
      verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastEmailSent: new Date(),
    },
  })

  const result = await sendVerificationEmail(user.email, user.name, rawToken)

  return ok({
    message: result.delivered
      ? "Verification email sent! Check your inbox."
      : "Email delivery is not configured on this server yet.",
    devVerificationUrl: result.delivered ? undefined : result.devUrl,
  })
}
