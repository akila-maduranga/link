import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { ArrowLeft, Eye, MousePointerClick, Star, Users } from "lucide-react"
import { db } from "@/lib/db"
import { LinkCard } from "@/components/links/link-card"
import { PlatformIcon } from "@/components/brand-icons"
import { getPlatform } from "@/data/platforms"
import { PLATFORM_SEO } from "@/data/platform-seo"
import { getCategory } from "@/data/categories"
import { countryFlag, countryName } from "@/data/countries"
import { languageName } from "@/data/languages"
import { formatCount, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JsonLd } from "@/components/seo/json-ld"
import {
  absoluteUrl,
  breadcrumbSchema,
  listingSchema,
  OG_IMAGE_PATH,
  type BreadcrumbItem,
} from "@/lib/seo"

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

  const platform = getPlatform(link.platform)
  const category = getCategory(link.category)
  // Title pattern: "[Community Name] – [Platform] [Channel/Group]" (the
  // "%s | FindLink" template appends the brand).
  const title = `${link.title} – ${platform.name} ${platform.label.toLowerCase()}`
  // Meta description from the submitted listing description, truncated to
  // ~155 chars (word-safe: cut back to the last space, add ellipsis).
  const rawDesc =
    link.description?.slice(0, 160) ||
    `Discover ${link.title}, a ${platform.name} ${platform.label.toLowerCase()} in ${category.name}, on FindLink — the free community link directory.`
  const description =
    rawDesc.length > 155 ? `${rawDesc.slice(0, 155).replace(/\s+\S*$/, "")}…` : rawDesc

  return {
    title,
    description,
    keywords: [
      link.title,
      `${platform.name} ${platform.label.toLowerCase()}`,
      category.name,
      countryName(link.country).split(" /")[0],
    ],
    alternates: { canonical: `/link/${link.slug}` },
    openGraph: {
      title,
      description,
      url: `/link/${link.slug}`,
      siteName: "FindLink",
      type: "website",
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
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

  // Related listings: same platform + same category first, then top same-platform
  // listings to fill up to 3 (read-only queries — no backend process changes).
  const [sameCategory, samePlatform] = await Promise.all([
    db.link.findMany({
      where: {
        status: "ACTIVE",
        platform: link.platform,
        category: link.category,
        id: { not: link.id },
      },
      orderBy: { clicks: "desc" },
      take: 3,
    }),
    db.link.findMany({
      where: { status: "ACTIVE", platform: link.platform, id: { not: link.id } },
      orderBy: { clicks: "desc" },
      take: 6,
    }),
  ])
  const related = [
    ...sameCategory,
    ...samePlatform.filter((p) => !sameCategory.some((c) => c.id === p.id)),
  ].slice(0, 3)

  // Breadcrumb mirrors the visible navigation: Home → Explore → platform
  // directory → category → listing. Absolute URLs per schema.org requirements.
  const platformHeading =
    PLATFORM_SEO[link.platform]?.heading ?? `${platform.name} directory`
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Explore", url: absoluteUrl("/explore") },
    { name: platformHeading, url: absoluteUrl(`/explore/${link.platform}`) },
    {
      name: category.name,
      url: absoluteUrl(`/explore?platform=${link.platform}&category=${link.category}`),
    },
    { name: link.title, url: absoluteUrl(`/link/${link.slug}`) },
  ]

  // Individual listing structured data: WebPage + CreativeWork (mainEntity).
  const pageDescription =
    link.description?.slice(0, 300) ||
    `Discover ${link.title}, a ${platform.name} ${platform.label.toLowerCase()} in ${category.name}, on FindLink.`

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          listingSchema({
            name: link.title,
            description: pageDescription,
            url: absoluteUrl(`/link/${link.slug}`),
            category: category.name,
            datePublished: link.createdAt,
            inLanguage: link.language,
          }),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-4 -ml-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-muted-foreground">
              <Link href="/" className="gap-1">Home</Link>
            </Button>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-muted-foreground">
              <Link href="/explore" className="gap-1">Explore</Link>
            </Button>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-muted-foreground">
              <Link href={`/explore/${link.platform}`} className="gap-1">
                {platformHeading}
              </Link>
            </Button>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-muted-foreground">
              <Link
                href={`/explore?platform=${link.platform}&category=${link.category}`}
                className="gap-1"
              >
                {category.name}
              </Link>
            </Button>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="ml-1 max-w-[14rem] truncate font-medium text-foreground">
            {link.title}
          </li>
        </ol>
      </nav>

      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-lg text-muted-foreground">
        <Link href={`/explore?platform=${link.platform}`} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to {platform.name} {platform.label.toLowerCase()}s
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
          <h2 className="text-xl font-bold tracking-tight">Related {platform.name} communities</h2>
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
