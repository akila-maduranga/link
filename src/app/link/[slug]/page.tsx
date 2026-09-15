import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { ArrowLeft, Eye, MousePointerClick, Star, Users } from "lucide-react"
import { db } from "@/lib/db"
import { LinkCard } from "@/components/links/link-card"
import { PlatformIcon } from "@/components/brand-icons"
import { getPlatform } from "@/data/platforms"
import { getCategory } from "@/data/categories"
import { countryFlag, countryName } from "@/data/countries"
import { languageName } from "@/data/languages"
import { formatCount, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function getLink(slug: string) {
  return db.link.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { user: { select: { name: true } } },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const link = await getLink(slug)
  if (!link) return { title: "Link not found" }
  return {
    title: link.title,
    description:
      link.description ??
      `${link.title} — a ${getPlatform(link.platform).name} ${getPlatform(link.platform).label.toLowerCase()} on FindLink`,
    openGraph: {
      title: link.title,
      description: link.description ?? `Discover ${link.title} on FindLink`,
      type: "website",
    },
  }
}

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const link = await getLink(slug)
  if (!link) notFound()

  // Count a view (after the response is streamed)
  after(async () => {
    try {
      await db.link.update({ where: { id: link.id }, data: { views: { increment: 1 } } })
    } catch (err) {
      console.error("[link] view increment failed:", err)
    }
  })

  const platform = getPlatform(link.platform)
  const category = getCategory(link.category)

  const related = await db.link.findMany({
    where: {
      status: "ACTIVE",
      platform: link.platform,
      id: { not: link.id },
    },
    orderBy: { clicks: "desc" },
    take: 3,
  })

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-lg text-muted-foreground">
        <Link href="/explore" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>
      </Button>

      <div className="bg-grid relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-10">
        <div
          className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `${platform.color}22` }}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background/40"
            style={{ boxShadow: `0 8px 32px -8px ${platform.color}66` }}
          >
            <PlatformIcon platform={link.platform} className="h-9 w-9" />
          </span>

          <div className="min-w-0 flex-1">
            {link.featured && (
              <Badge className="mb-3 gap-1 rounded-full px-3">
                <Star className="h-3 w-3 fill-current" /> Featured
              </Badge>
            )}
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {link.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {platform.name} · {platform.label}
              {link.members && (
                <>
                  {" · "}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {link.members} members
                  </span>
                </>
              )}
            </p>
            {link.description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {link.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="rounded-md">{category.name}</Badge>
              <Badge variant="secondary" className="rounded-md">
                {countryFlag(link.country)} {countryName(link.country)}
              </Badge>
              <Badge variant="secondary" className="rounded-md">{languageName(link.language)}</Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> {formatCount(link.views)} views
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" /> {formatCount(link.clicks)} clicks
              </span>
              <span>Listed {formatDate(link.createdAt)}</span>
              {link.user?.name && <span>by {link.user.name}</span>}
            </div>
          </div>

          <Button asChild size="lg" className="rounded-xl px-8 text-base font-semibold glow sm:ml-2">
            <a
              href={`/go/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="whitespace-nowrap"
            >
              Join now
            </a>
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">More {platform.name} communities</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <LinkCard key={r.id} link={JSON.parse(JSON.stringify(r))} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
