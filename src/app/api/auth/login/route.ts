import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { loginSchema } from "@/lib/validators"
import { setSessionCookie } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

/**
 * A well-formed bcrypt hash of an unguessable password. Comparing against it
 * when the email is unknown keeps the response time ~identical to the
 * "user exists" path, so attackers can't enumerate accounts via timing
 * (OWASP ASVS 2.5.4 / A07:2021).
 */
const DUMMY_BCRYPT_HASH =
  "$2b$10$tYlq4ZQEH.kDWrty906zC.2dFmxdXJcg56wxWjWOBlVM8Qmn1.Pvy"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const rl = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000) // 10 per 10 min per IP
  if (!rl.ok) return fail("Too many login attempts. Try again later.", 429)

  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const { email, password } = parsed.data

  // Short per-account window: blunts distributed password guessing on one
  // account without a long lockout that could be weaponised for DoS.
  const rlAccount = rateLimit(`login-acct:${email}`, 10, 10 * 60 * 1000)
  if (!rlAccount.ok) return fail("Too many login attempts. Try again later.", 429)

  const user = await db.user.findUnique({ where: { email } })
  // Always run one bcrypt compare (dummy hash when the user is unknown)
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_BCRYPT_HASH)
  if (!user || !passwordOk) {
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
