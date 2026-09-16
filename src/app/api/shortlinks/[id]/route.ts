import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { shortLinkUpdateSchema } from "@/lib/validators"
import { BodyTooLargeError, fail, ok, readJsonBody } from "@/lib/api"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SELECT = {
  id: true,
  slug: true,
  destination: true,
  title: true,
  description: true,
  isActive: true,
  clicks: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShortLinkSelect

async function getOwned(id: string, userId: string, isAdmin: boolean) {
  const link = await db.shortLink.findUnique({ where: { id }, select: { userId: true } })
  if (!link) return { error: fail("Short link not found", 404) }
  if (link.userId !== userId && !isAdmin) return { error: fail("Not your short link", 403) }
  return { error: null }
}

/** GET /api/shortlinks/:id — one short link. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const { error } = await getOwned(id, session.sub, session.role === "ADMIN")
  if (error) return error

  const link = await db.shortLink.findUnique({ where: { id }, select: SELECT })
  if (!link) return fail("Short link not found", 404)
  return ok({ link })
}

/** PATCH /api/shortlinks/:id — update. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const { error } = await getOwned(id, session.sub, session.role === "ADMIN")
  if (error) return error

  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch (err) {
    if (err instanceof BodyTooLargeError) return fail("Request body too large", 413)
    return fail("Invalid request body")
  }

  const parsed = shortLinkUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422)
  }
  const data = parsed.data

  const link = await db.shortLink.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title || null } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.destination !== undefined ? { destination: data.destination } : {}),
    },
    select: SELECT,
  })

  return ok({ link, message: "Short link updated" })
}

/** DELETE /api/shortlinks/:id. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return fail("You need to be signed in", 401)

  const { id } = await params
  const { error } = await getOwned(id, session.sub, session.role === "ADMIN")
  if (error) return error

  await db.shortLink.delete({ where: { id } })
  return ok({ message: "Short link deleted" })
}
