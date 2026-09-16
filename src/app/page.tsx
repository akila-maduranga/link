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
import { Button } from "@/components/ui/button"

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
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-in fade-in slide-in-from-bottom-2 mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary duration-700">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">findlink.site — free & open community directory + shortener</span>
              <span className="sm:hidden">findlink.site — free & open directory</span>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-3 text-4xl font-extrabold leading-[1.1] tracking-tight duration-700 sm:text-5xl md:text-6xl">
              Every community,
              <br />
              <span className="text-gradient">one short link away</span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground duration-700 sm:text-lg">
              Discover and share the best Telegram channels, WhatsApp groups, Facebook pages
              and more — filtered by category, country and language. Then shrink any URL and
              watch every click with detailed analytics.
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
                href={`/explore?platform=${p.id}`}
                className="group flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-accent/60"
                title={`Browse ${p.name}`}
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
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured communities</h2>
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
              Packed with features, effortless to use
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
                title: "Smart discovery",
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
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
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
            {session ? "Your links are waiting" : "Ready to grow your community?"}
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
    </div>
  )
}
