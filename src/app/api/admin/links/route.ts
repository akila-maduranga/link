import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/admin/links — all links, with optional status filter + pagination. */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? ""
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100)
  const page = Math.max(1, Math.min(500, Number(searchParams.get("page")) || 1))
  const pageSize = 20

  const where: Prisma.LinkWhereInput = {}
  if (status) where.status = status
  if (q) where.OR = [{ title: { contains: q } }, { url: { contains: q } }]

  const [links, total] = await Promise.all([
    db.link.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        url: true,
        platform: true,
        category: true,
        country: true,
        status: true,
        featured: true,
        clicks: true,
        views: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.link.count({ where }),
  ])

  return ok({
    links,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  })
}

/** PATCH /api/admin/links — moderate a link: feature/hide/activate. */
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return fail("Admins only", 403)

  let body: { id?: string; featured?: boolean; status?: string }
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const { id, featured, status } = body
  if (!id) return fail("Link id required", 422)
  if (status && !["ACTIVE", "HIDDEN"].includes(status)) return fail("Invalid status", 422)

  const link = await db.link.update({
    where: { id },
    data: {
      ...(featured !== undefined ? { featured } : {}),
      ...(status ? { status } : {}),
    },
    select: { id: true, featured: true, status: true },
  })

  return ok({ link, message: "Link updated" })
}
