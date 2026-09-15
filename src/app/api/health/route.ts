import { db } from "@/lib/db"
import { ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/health — used by the Docker healthcheck. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return ok({ status: "healthy", db: "up", time: new Date().toISOString() })
  } catch {
    return Response.json({ ok: false, status: "unhealthy", db: "down" }, { status: 503 })
  }
}
