import { clearSessionCookie } from "@/lib/auth"
import { ok } from "@/lib/api"

export const runtime = "nodejs"

export async function POST() {
  await clearSessionCookie()
  return ok({ message: "Signed out" })
}
