import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { linkSubmitSchema } from "@/lib/validators"
import { uniqueLinkSlug } from "@/lib/slug"
import { fail, ok } from "@/lib/api"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const LINK_SELECT = {
  id: true,
  slug: true,
  title: true,
  url: true,
  description: true,
  platform: true,
  category: true,
  country: true,
  language: true,
  members: true,
  featured: true,
  status: true,
  views: true,
  clicks: true,
  createdAt: true,
  user: { select: { name: true } },
} satisfies Prisma.LinkSelect

/** GET /api/links/:id — a single link (id or slug). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const link = await db.link.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: LINK_SELECT,
  })
  if (!link) return fail("Link not found", 404)
  return ok({ link })
}

/** PATCH /api/links/:id — update your own link. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const existing = await db.link.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return fail("Link not found", 404)
  const isAdmin = session.role === "ADMIN"
  if (existing.userId !== session.sub && !isAdmin) return fail("Not your link", 403)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("Invalid request body")
  }

  const parsed = linkSubmitSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const data = parsed.data

  const link = await db.link.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.url ? { url: data.url } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.platform ? { platform: data.platform } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.country ? { country: data.country } : {}),
      ...(data.language ? { language: data.language } : {}),
      ...(data.members !== undefined ? { members: data.members || null } : {}),
    },
    select: LINK_SELECT,
  })

  return ok({ link, message: "Link updated" })
}

/** DELETE /api/links/:id — delete your own link (or any, as admin). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const existing = await db.link.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return fail("Link not found", 404)
  const isAdmin = session.role === "ADMIN"
  if (existing.userId !== session.sub && !isAdmin) return fail("Not your link", 403)

  await db.link.delete({ where: { id } })
  return ok({ message: "Link deleted" })
}
