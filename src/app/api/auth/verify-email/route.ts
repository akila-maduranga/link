import { createHash } from "crypto"
import { db } from "@/lib/db"
import { setSessionCookie } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: { token?: string }
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const token = body.token
  if (!token || token.length < 10) return fail("Invalid verification token", 422)

  const hashed = createHash("sha256").update(token).digest("hex")
  const user = await db.user.findUnique({ where: { verifyToken: hashed } })

  if (!user) return fail("This verification link is invalid or has already been used", 400)
  if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
    return fail("This verification link has expired. Request a new one.", 410)
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verifyToken: null,
      verifyTokenExp: null,
    },
  })

  await setSessionCookie({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role === "ADMIN" ? "ADMIN" : "USER",
    verified: true,
  })

  return ok({
    message: "Email verified successfully!",
    user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, verified: true },
  })
}
