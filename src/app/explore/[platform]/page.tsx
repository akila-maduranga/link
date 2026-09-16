import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Globe2, Plus, Rocket, Tag } from "lucide-react"
import { db } from "@/lib/db"
import { LinkCard } from "@/components/links/link-card"
import { PlatformIcon } from "@/components/brand-icons"
import { getPlatform, PLATFORMS } from "@/data/platforms"
import { PLATFORM_SEO } from "@/data/platform-seo"
import { getCategory } from "@/data/categories"
import { JsonLd } from "@/components/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  absoluteUrl,
  breadcrumbSchema,
  collectionSchema,
  OG_IMAGE_PATH,
  type BreadcrumbItem,
} from "@/lib/seo"

export const dynamic = "force-dynamic"

/**
 * Platform directory landing pages — /explore/telegram, /explore/whatsapp, …
 *
 * Fully SERVER-RENDERED listings (read-only Prisma queries — no API changes,
 * no client fetch waterfall): crawlers receive the complete HTML with the
 * listings, unique per-platform copy, canonical URL and JSON-LD on the
 * first response.
 */

const LISTINGS_SHOWN = 24

function seoFor(platform: string) {
  return PLATFORM_SEO[platform as keyof typeof PLATFORM_SEO]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>
}): Promise<Metadata> {
  const { platform } = await params
  const seo = seoFor(platform)
  if (!seo) return { title: "Directory not found" }

  const url = `/explore/${platform}`
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: "FindLink",
      type: "website",
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [OG_IMAGE_PATH],
    },
  }
}

export default async function PlatformDirectoryPage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  const seo = seoFor(platform)
  if (!seo) notFound()

  const platformMeta = getPlatform(platform)

  // Read-only directory queries (no writes, no backend process changes).
  const [listings, total, categories, countries, languages, latest] =
    await Promise.all([
      db.link.findMany({
        where: { platform, status: "ACTIVE" },
        orderBy: [{ featured: "desc" }, { clicks: "desc" }],
        take: LISTINGS_SHOWN,
      }),
      db.link.count({ where: { platform, status: "ACTIVE" } }),
      db.link.groupBy({
        by: ["category"],
        where: { platform, status: "ACTIVE" },
        _count: true,
        orderBy: { _count: { category: "desc" } },
        take: 10,
      }),
      db.link.findMany({
        where: { platform, status: "ACTIVE" },
        select: { country: true },
        distinct: ["country"],
      }),
      db.link.findMany({
        where: { platform, status: "ACTIVE" },
        select: { language: true },
        distinct: ["language"],
      }),
      db.link.findFirst({
        where: { platform, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ])

  const shown = listings.map((l) => JSON.parse(JSON.stringify(l)))
  const url = absoluteUrl(`/explore/${platform}`)

  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Explore", url: absoluteUrl("/explore") },
    { name: seo.heading, url },
  ]

  return (
    <div className="flex flex-col">
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          collectionSchema({
            name: `${seo.title} | FindLink`,
            description: seo.description,
            url,
            items: shown.map((l: { title: string; slug: string }) => ({
              name: l.title,
              url: absoluteUrl(`/link/${l.slug}`),
            })),
          }),
        ]}
      />

      {/* ------------------------------ Header ------------------------------ */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${platformMeta.color}1f` }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/explore" className="transition-colors hover:text-foreground">
                  Explore
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-foreground">
                {seo.heading}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background/40"
              style={{ boxShadow: `0 8px 32px -8px ${platformMeta.color}66` }}
            >
              <PlatformIcon platform={platform} className="h-9 w-9" />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold capitalize leading-tight tracking-tight sm:text-4xl">
                {seo.heading}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {seo.intro}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full font-medium">
                  {total} {total === 1 ? seo.noun : seo.nounPlural} listed
                </Badge>
                {categories.length > 0 && (
                  <Badge variant="secondary" className="rounded-full font-medium">
                    {categories.length} {categories.length === 1 ? "category" : "categories"}
                  </Badge>
                )}
                {countries.length > 0 && (
                  <Badge variant="secondary" className="rounded-full font-medium">
                    <Globe2 className="mr-1 h-3 w-3" />
                    {countries.length} {countries.length === 1 ? "country" : "countries"}
                  </Badge>
                )}
                {languages.length > 0 && (
                  <Badge variant="secondary" className="rounded-full font-medium">
                    {languages.length} {languages.length === 1 ? "language" : "languages"}
                  </Badge>
                )}
                {latest?.updatedAt && (
                  <span className="hidden sm:inline">
                    · Updated{" "}
                    {new Date(latest.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            <Button asChild variant="outline" className="hidden shrink-0 rounded-xl sm:flex">
              <Link href={`/explore?platform=${platform}`} className="gap-2">
                Filter & search <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Category chips — deep links into the filterable explore view */}
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Popular categories:
              </span>
              {categories.map((c) => {
                const cat = getCategory(c.category)
                return (
                  <Link
                    key={c.category}
                    href={`/explore?platform=${platform}&category=${c.category}`}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {cat.name}
                    <span className="ml-1 text-[10px] opacity-60">{c._count}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------- Listings ----------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {shown.length > 0 ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Top {platformMeta.name} {seo.nounPlural}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Ranked by featured status and live clicks — the {seo.nounPlural}{" "}
                  visitors actually join.
                </p>
              </div>
              {total > LISTINGS_SHOWN && (
                <Button asChild variant="outline" className="hidden shrink-0 rounded-xl sm:flex">
                  <Link href={`/explore?platform=${platform}`} className="gap-2">
                    View all {total} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <Rocket className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">
              No {platformMeta.name} {seo.nounPlural} listed yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Be the first to list a {platformMeta.name} {seo.noun} here — it
              takes less than a minute and it&apos;s free.
            </p>
            <Button asChild className="mt-6 rounded-xl font-semibold">
              <Link href="/dashboard/submit" className="gap-2">
                <Plus className="h-4 w-4" /> Submit the first one
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* ------------------------- Other platforms ------------------------- */}
      <section className="border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
            Browse other platforms
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            One directory, every community — {PLATFORMS.length} platforms with the
            same filters and click stats.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {PLATFORMS.filter((p) => p.id !== platform).map((p) => {
              const pSeo = seoFor(p.id)
              return (
                <Link
                  key={p.id}
                  href={`/explore/${p.id}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/40"
                  title={pSeo ? `Browse ${pSeo.heading}` : `Browse ${p.name}`}
                >
                  <PlatformIcon platform={p.id} className="h-7 w-7 transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">
                    {p.name}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Keyword-rich context line: what's in the wider directory */}
          <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            FindLink is a free community link directory: find and join{" "}
            <Link href="/explore/telegram" className="underline-offset-2 hover:underline">Telegram channels</Link>,{" "}
            <Link href="/explore/whatsapp" className="underline-offset-2 hover:underline">WhatsApp groups</Link>,{" "}
            <Link href="/explore/facebook" className="underline-offset-2 hover:underline">Facebook groups</Link>,{" "}
            <Link href="/explore/youtube" className="underline-offset-2 hover:underline">YouTube channels</Link> and{" "}
            <Link href="/explore/discord" className="underline-offset-2 hover:underline">Discord servers</Link>{" "}
            from around the world — then shorten any URL and track every click
            with detailed analytics.
          </p>
        </div>
      </section>
    </div>
  )
}
