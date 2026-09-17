import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Link2,
  Lock,
  MousePointerClick,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { LinkCard } from "@/components/links/link-card"
import { formatCount } from "@/lib/format"
import { ShortenForm } from "@/components/shortener/shorten-form"
import { PlatformIcon } from "@/components/brand-icons"
import { PLATFORMS } from "@/data/platforms"
import { PLATFORM_SEO } from "@/data/platform-seo"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, collectionSchema } from "@/lib/seo"

export const dynamic = "force-dynamic"

async function getLandingData() {
  try {
    const [links, shortLinks, clicks, countries, featured] = await Promise.all([
      db.link.count({ where: { status: "ACTIVE" } }),
      db.shortLink.count(),
      db.shortLink.aggregate({ _sum: { clicks: true } }),
      db.link.findMany({ where: { status: "ACTIVE" }, select: { country: true }, distinct: ["country"] }),
      db.link.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ featured: "desc" }, { clicks: "desc" }],
        take: 6,
      }),
    ])
    return {
      links,
      shortLinks,
      clicks: clicks._sum.clicks ?? 0,
      countries: countries.length,
      featured,
    }
  } catch {
    return { links: 0, shortLinks: 0, clicks: 0, countries: 0, featured: [] }
  }
}

export default async function HomePage() {
  const stats = await getLandingData()
  // Signed-in visitors never see "create account" marketing — they get a
  // straight path back into the product.
  const session = await getSession()

  return (
    <div className="flex flex-col">
      {/* Featured communities as ItemList structured data (server-rendered) */}
      <JsonLd
        data={collectionSchema({
          name: "Featured communities | FindLink",
          description:
            "The most clicked listings across the FindLink community directory this week.",
          url: absoluteUrl("/"),
          items: stats.featured.map((l) => ({
            name: l.title,
            url: absoluteUrl(`/link/${l.slug}`),
          })),
        })}
      />

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-in fade-in slide-in-from-bottom-2 mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary duration-700">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">findlink.site — free &amp; open community directory + shortener</span>
              <span className="sm:hidden">findlink.site — free &amp; open directory</span>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-3 text-balance text-3xl font-extrabold leading-[1.15] tracking-tight duration-700 sm:text-4xl md:text-5xl">
              Find Communities &amp; Shorten Links |{" "}
              <span className="text-gradient">Free Directory &amp; URL Shortener</span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground duration-700 sm:text-lg">
              Discover and share the best Telegram channels, WhatsApp groups, Facebook pages
              and more — filtered by category, country and language. Then shorten any URL and
              track every click with detailed analytics.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-5 mx-auto mt-10 max-w-xl duration-700">
              <ShortenForm variant="hero" serverSession={session ? { verified: session.verified } : null} />
            </div>
          </div>

          {/* Live stats */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Listed links", value: formatCount(stats.links), icon: Link2 },
              { label: "Short links", value: formatCount(stats.shortLinks), icon: Zap },
              { label: "Tracked clicks", value: formatCount(stats.clicks), icon: MousePointerClick },
              { label: "Countries", value: String(stats.countries), icon: Globe2 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card/60 p-4 text-center backdrop-blur"
              >
                <stat.icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-2 text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Platform strip --------------------------- */}
      <section className="border-b border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* justify-start below lg: with overflow-x-auto + centering, flexbox centers the
              overflowing row and the leading icons render off-screen (unreachable). */}
          <div className="no-scrollbar flex items-center justify-start gap-3 overflow-x-auto sm:gap-4 lg:justify-center">
            {PLATFORMS.slice(0, 10).map((p) => (
              <Link
                key={p.id}
                href={`/explore/${p.id}`}
                className="group flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-accent/60"
                title={
                  PLATFORM_SEO[p.id]?.heading
                    ? `Browse ${PLATFORM_SEO[p.id]?.heading}`
                    : `Browse ${p.name}`
                }
              >
                <PlatformIcon platform={p.id} className="h-7 w-7 transition-transform group-hover:scale-110" />
                <span className="hidden text-[11px] font-medium text-muted-foreground group-hover:text-foreground sm:block">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Featured links --------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured Communities</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              The most clicked listings across the directory this week.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden shrink-0 rounded-xl sm:flex">
            <Link href="/explore" className="gap-2">
              Explore all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {stats.featured.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.featured.map((link) => (
              <LinkCard key={link.id} link={JSON.parse(JSON.stringify(link))} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <Rocket className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">The directory is warming up</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {session
                ? "No listings yet. Be the very first to share a community — it takes less than a minute."
                : "No listings yet. Create an account and be the very first to share a community — it takes less than a minute."}
            </p>
            <Button asChild className="mt-6 rounded-xl font-semibold">
              <Link href="/dashboard/submit" className="gap-2">
                Submit the first link <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* ------------------------------ Features ------------------------------ */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Directory Features
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Everything you need to run a professional link hub — fast, reliable and free
              to start.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Smart discovery: ",
                description:
                  "Filter thousands of communities by platform, category, country and language. Full-text search across titles and descriptions, sorted by what's trending.",
              },
              {
                icon: Zap,
                title: "Lightning shortener",
                description:
                  "Shrink any URL to a memorable short code. Claim custom aliases, manage them from your dashboard, and toggle links on or off anytime.",
              },
              {
                icon: BarChart3,
                title: "Detailed analytics",
                description:
                  "Every click is tracked: country, browser, OS, device, referrer and unique visitors — visualised in clean, real-time charts.",
              },
              {
                icon: Globe2,
                title: "Global by default",
                description:
                  "250+ countries, 25 categories and 27 languages with flag badges — and click analytics that show exactly where your audience lives.",
              },
              {
                icon: ShieldCheck,
                title: "Verified & moderated",
                description:
                  "Every submission is email-verified and reviewed. Great listings get featured, abuse gets removed in one click.",
              },
              {
                icon: Lock,
                title: "Private by design",
                description:
                  "Visitor IPs are anonymized for unique-click counts and never stored raw. You get honest analytics while your audience stays respected.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card-hover group rounded-2xl border border-border/60 bg-card p-6 hover:-translate-y-1 hover:border-primary/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <feature.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- How it works ---------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Users,
              title: "Create your account",
              text: "Sign up in seconds and verify your email. Verification keeps the directory spam-free and trustworthy for everyone.",
            },
            {
              step: "02",
              icon: Link2,
              title: "Share & shorten",
              text: "Submit your Telegram, WhatsApp or Facebook communities to the directory — and shorten any URL with custom aliases.",
            },
            {
              step: "03",
              icon: BarChart3,
              title: "Track everything",
              text: "Watch clicks roll in with country, device, browser and referrer breakdowns. Know exactly where your traffic comes from.",
            },
          ].map((s) => (
            <div key={s.step} className="relative rounded-2xl border border-border/60 bg-card p-6">
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-primary/15">{s.step}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="bg-grid relative overflow-hidden rounded-3xl border border-primary/25 bg-primary/5 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-4xl">
            {session ? "Your links are waiting" : "Grow Your Community"}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {session
              ? "Pick up where you left off — manage your links, check today's clicks and keep growing."
              : "Join FindLink today — list your groups, shorten your links and get analytics that actually tell you where your audience lives."}
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {session ? (
              <Button asChild size="lg" className="rounded-xl px-8 text-base font-semibold glow">
                <Link href="/dashboard" className="gap-2">
                  Go to your dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="rounded-xl px-8 text-base font-semibold glow">
                <Link href="/register" className="gap-2">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="rounded-xl px-8">
              <Link href="/explore">Browse the directory</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ----------------- Directory & shortener guides (SEO content) ----------------- */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Community Directory &amp; URL Shortener Guides
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Short, practical answers about community directories, country filtering and
              link shortening with analytics.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "What is a Community Directory and How Does It Work?",
                body: (
                  <>
                    <p>
                      A community directory is an organized, searchable listing of online
                      communities — Telegram channels, WhatsApp groups, Discord servers,
                      Facebook pages and more — grouped by category, country and language.
                      Instead of hunting through search results or forwarded links, you browse
                      one curated place and join straight from the listing.
                    </p>
                    <p>
                      FindLink works exactly this way: every submission is email-verified and
                      moderated, then published on its own shareable page with live click
                      stats.{" "}
                      <Link
                        href="/explore"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Explore the social media directory
                      </Link>{" "}
                      to see it in action.
                    </p>
                  </>
                ),
              },
              {
                title: "How to Grow Your Community with FindLink Directory",
                body: (
                  <>
                    <p>
                      Growth starts with discoverability. Submit your community with a clear
                      title and an honest description, pick the right category, country and
                      language, and share your public FindLink page wherever you already post —
                      bios, pinned messages, forums.
                    </p>
                    <p>
                      Each listing shows live click counts, so you can see which promotions
                      actually convert into visitors. Pair it with a short link and you get the
                      same measurable feedback for every URL you share.
                    </p>
                  </>
                ),
              },
              {
                title: "Link Shortener with Analytics: Track Your Performance",
                body: (
                  <>
                    <p>
                      FindLink doubles as a link shortener with analytics built in. Paste any
                      URL, claim a memorable short code, and watch clicks arrive in real time —
                      country, device, browser, operating system, referrer and unique visitors.
                    </p>
                    <p>
                      Link tracking analytics answer what generic shorteners cannot: where your
                      audience lives, which posts convert, and when interest fades. Short links
                      with click analytics are free to start; premium removes the tracking
                      limit.
                    </p>
                  </>
                ),
              },
              {
                title: "Directory by Country: Find Communities Worldwide",
                body: (
                  <>
                    <p>
                      Communities are local by nature — language, culture and time zones all
                      matter. The directory by country view spans 250+ countries with flag
                      badges, so you can find WhatsApp groups near you or Telegram channels in
                      your language.
                    </p>
                    <p>
                      <Link
                        href="/explore"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Filter the whole directory
                      </Link>{" "}
                      by country, category or language in a single click — and click analytics
                      break your own traffic down by country too, pairing discovery and
                      measurement in one place.
                    </p>
                  </>
                ),
              },
              {
                title: "Free URL Shortener vs. Other Shortening Services",
                body: (
                  <>
                    <p>
                      Most shortening services stop at the redirect. FindLink&rsquo;s free URL
                      shortener is built for community builders: short links include click
                      analytics at no extra cost, custom aliases are supported, and nothing
                      extra is appended to your URLs.
                    </p>
                    <p>
                      The same account also lists your communities in a public directory — one
                      place to share and measure everything. Visitor privacy is respected: IPs
                      are anonymized for unique-click counts and never stored raw.
                    </p>
                  </>
                ),
              },
              {
                title: "Telegram, WhatsApp & Facebook Directory: Platform Guides",
                body: (
                  <>
                    <p>
                      Every platform has its own directory page, refreshed continuously as
                      communities are approved. Browse the{" "}
                      <Link
                        href="/explore/telegram"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Telegram channel directory
                      </Link>
                      , the{" "}
                      <Link
                        href="/explore/whatsapp"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        WhatsApp groups directory
                      </Link>{" "}
                      or the{" "}
                      <Link
                        href="/explore/facebook"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Facebook pages directory
                      </Link>{" "}
                      for the most-clicked listings and category shortcuts.
                    </p>
                    <p>
                      Prefer the full picture?{" "}
                      <Link
                        href="/explore"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Explore all platforms at once
                      </Link>{" "}
                      — each guide links straight to active communities you can join in one
                      click.
                    </p>
                  </>
                ),
              },
            ].map((guide) => (
              <article
                key={guide.title}
                className="rounded-2xl border border-border/60 bg-card p-6"
              >
                <h3 className="text-base font-semibold">{guide.title}</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {guide.body}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
