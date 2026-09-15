import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "findlink_session"
const SESSION_DAYS = 7

export interface SessionPayload {
  sub: string // user id
  email: string
  name: string
  role: "USER" | "ADMIN"
  verified: boolean
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)")
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: (payload.role as "USER" | "ADMIN") ?? "USER",
      verified: Boolean(payload.verified),
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 })
}

/** Read + verify the session from cookies. Returns null when not logged in. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Same as getSession but returns null if email is not verified. */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session || !session.verified) return null
  return session
}
