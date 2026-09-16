import { createHash } from "crypto"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { resetPasswordSchema } from "@/lib/validators"
import { setSessionCookie } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const { token, password } = parsed.data

  const hashed = createHash("sha256").update(token).digest("hex")
  const user = await db.user.findUnique({ where: { resetToken: hashed } })

  if (!user) return fail("This reset link is invalid or has already been used", 400)
  if (user.resetTokenExp && user.resetTokenExp < new Date()) {
    return fail("This reset link has expired. Request a new one.", 410)
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExp: null,
    },
  })

  await setSessionCookie({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role === "ADMIN" ? "ADMIN" : "USER",
    verified: Boolean(updated.emailVerified),
  })

  return ok({ message: "Password updated. You are now signed in." })
}
