import Link from "next/link"
import { BarChart3, Crown, ExternalLink, Eye, Link2, MousePointerClick, Plus, TrendingUp, Zap } from "lucide-react"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { formatCount, formatDate } from "@/lib/format"
import { isPremiumActive, FREE_TRACKABLE_LIMIT } from "@/lib/premium"
import { Button } from "@/components/ui/button"
import { PlatformIcon } from "@/components/brand-icons"
import { ShortenForm } from "@/components/shortener/shorten-form"
import { getPlatform } from "@/data/platforms"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const [myLinks, myShortLinks, linkClicks, shortClicks, listingViews, me, trackableCount] =
    await Promise.all([
      db.link.count({ where: { userId: session.sub } }),
      db.shortLink.count({ where: { userId: session.sub } }),
      db.link.aggregate({ where: { userId: session.sub }, _sum: { clicks: true } }),
      db.shortLink.aggregate({ where: { userId: session.sub }, _sum: { clicks: true } }),
      db.link.aggregate({ where: { userId: session.sub }, _sum: { views: true } }),
      db.user.findUnique({ where: { id: session.sub }, select: { premiumUntil: true } }),
      db.shortLink.count({ where: { userId: session.sub, trackable: true } }),
    ])

  const recentShortLinks = await db.shortLink.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, slug: true, destination: true, clicks: true, createdAt: true },
  })

  const recentLinks = await db.link.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, slug: true, title: true, platform: true, clicks: true, views: true, createdAt: true },
  })

  const totalClicks = (linkClicks._sum.clicks ?? 0) + (shortClicks._sum.clicks ?? 0)
  const premium = isPremiumActive(me?.premiumUntil)
  const daysLeft = me?.premiumUntil
    ? Math.max(0, Math.ceil((new Date(me.premiumUntil).getTime() - Date.now()) / 86400000))
    : 0
  const premiumUntilText = me?.premiumUntil
    ? new Date(me.premiumUntil).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null

  const cards = [
    { label: "My listings", value: myLinks, icon: Link2, href: "/dashboard/links" },
    { label: "Short links", value: myShortLinks, icon: Zap, href: "/dashboard/shortlinks" },
    { label: "Total clicks", value: totalClicks, icon: MousePointerClick, href: "/dashboard/shortlinks" },
    { label: "Listing views", value: listingViews._sum.views ?? 0, icon: Eye, href: "/dashboard/links" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hey {session.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your links.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <Link href="/dashboard/submit">
              <Plus className="h-4 w-4" /> Submit link
            </Link>
          </Button>
          <Button asChild className="rounded-xl gap-2 font-semibold">
            <Link href="/dashboard/shortlinks">
              <Zap className="h-4 w-4" /> New short link
            </Link>
          </Button>
        </div>
      </div>

      {/* Plan banner */}
      <div
        className={
          premium
            ? "flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Crown className="h-4.5 w-4.5 text-primary" />
          </span>
          {premium ? (
            <div>
              <p className="text-sm font-semibold">Premium active{premiumUntilText ? ` until ${premiumUntilText}` : ""}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Unlimited tracked short links{daysLeft > 0 && daysLeft <= 7 ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : ""}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold">
                Free plan · {trackableCount}/{FREE_TRACKABLE_LIMIT} tracked links used
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Untracked short links, redirects and community submissions stay unlimited — premium unlocks analytics on every link.
              </p>
            </div>
          )}
        </div>
        <Button
          asChild
          variant={premium ? "outline" : "default"}
          size="sm"
          className="shrink-0 rounded-xl font-semibold"
        >
          <Link href="/premium">
            <Crown className="h-4 w-4" />
            {premium ? "Extend premium" : "Upgrade — $3/month"}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card-hover rounded-2xl border border-border/60 bg-card p-5 hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <c.icon className="h-4.5 w-4.5 text-primary" />
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{formatCount(c.value)}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick shorten */}
      <section>
        <h2 className="text-lg font-semibold">Quick shorten</h2>
        <div className="mt-3">
          <ShortenForm variant="dashboard" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent short links */}
        <section className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent short links</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-primary">
              <Link href="/dashboard/shortlinks">View all</Link>
            </Button>
          </div>
          {recentShortLinks.length > 0 ? (
            <ul className="mt-4 divide-y divide-border/50">
              {recentShortLinks.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">/s/{s.slug}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.destination}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{formatCount(s.clicks)}</p>
                    <p className="text-[11px] text-muted-foreground">clicks</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" aria-label="View analytics">
                    <Link href={`/dashboard/shortlinks/${s.id}`}>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center">
              <Zap className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No short links yet — shorten your first URL above.
              </p>
            </div>
          )}
        </section>

        {/* Recent listings */}
        <section className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent listings</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-primary">
              <Link href="/dashboard/links">View all</Link>
            </Button>
          </div>
          {recentLinks.length > 0 ? (
            <ul className="mt-4 divide-y divide-border/50">
              {recentLinks.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50">
                    <PlatformIcon platform={l.platform} className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/link/${l.slug}`} className="block truncate text-sm font-medium hover:text-primary">
                      {l.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {getPlatform(l.platform).name} · {formatDate(l.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{formatCount(l.clicks)}</p>
                    <p className="text-[11px] text-muted-foreground">clicks</p>
                  </div>
                  <a
                    href={`/go/${l.slug}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center">
              <Link2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No listings yet —{" "}
                <Link href="/dashboard/submit" className="text-primary hover:underline">
                  submit your first community
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
