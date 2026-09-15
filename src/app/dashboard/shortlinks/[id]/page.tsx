import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { AnalyticsClient } from "@/components/dashboard/analytics-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Short link analytics" }

export default async function ShortLinkAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login?next=/dashboard/shortlinks")

  const { id } = await params
  const link = await db.shortLink.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      destination: true,
      title: true,
      isActive: true,
      clicks: true,
      userId: true,
    },
  })

  if (!link) notFound()
  if (link.userId !== session.sub && session.role !== "ADMIN") notFound()

  return <AnalyticsClient link={JSON.parse(JSON.stringify(link))} />
}
