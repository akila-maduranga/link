import type { Metadata } from "next"
import { Crown, ShieldCheck, Zap, BarChart3, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PremiumClient } from "@/components/premium/premium-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Premium — unlimited tracked short links",
  description:
    "FindLink Premium: unlimited short links with full click analytics for $3 a month. Free accounts keep 2 tracked links and unlimited communities.",
}

const COMPARISON: Array<{ label: string; free: string; premium: string }> = [
  { label: "Trackable short links (with click analytics)", free: "2", premium: "Unlimited" },
  { label: "Untrackable short links (no analytics)", free: "Unlimited", premium: "Unlimited" },
  { label: "Detailed click analytics — country, device, browser, referrer", free: "On tracked links", premium: "On every link" },
  { label: "Adding communities & groups to the directory", free: "Free forever", premium: "Free forever" },
  { label: "Short link redirects", free: "Unlimited", premium: "Unlimited" },
]

export default function PremiumPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          <Crown className="h-4 w-4" /> FindLink Premium
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Unlimited tracked short links
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          See who clicks your links — country, device, browser and referrer — on every short
          link you create. Communities and untracked links stay free for everyone, always.
        </p>
        <p className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          $3
          <span className="ml-2 text-base font-medium text-muted-foreground">/ month</span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          30 days of premium per payment — renew whenever you like
        </p>
      </div>

      {/* Checkout island (client): status + PayPal buttons */}
      <PremiumClient />

      {/* Comparison table */}
      <section className="mt-14" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="text-center text-2xl font-bold tracking-tight">
          Free vs Premium
        </h2>
        <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card">
                <th scope="col" className="px-4 py-3.5 text-left font-medium text-muted-foreground">
                  What you get
                </th>
                <th scope="col" className="px-4 py-3.5 text-center font-semibold">
                  Free
                </th>
                <th scope="col" className="px-4 py-3.5 text-center font-semibold text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="h-4 w-4" /> Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card/40">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3.5 text-muted-foreground">{row.label}</td>
                  <td className="px-4 py-3.5 text-center font-medium">{row.free}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-primary">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label="Premium highlights">
        {[
          {
            icon: BarChart3,
            title: "Full click analytics",
            text: "Every tracked link shows clicks over time, unique visitors, countries, devices, browsers, bots and referrers.",
          },
          {
            icon: ShieldCheck,
            title: "Secure checkout",
            text: "Payments run on PayPal's own secure infrastructure — your card details never touch our servers, and every payment is verified server-side before premium activates.",
          },
          {
            icon: Link2,
            title: "Everything else stays free",
            text: "Adding communities, untrackable short links and redirects remain unlimited and free for every account — premium only unlocks analytics.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <div className="mt-14 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-10 text-center">
        <Zap className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
          Two tracked links not enough?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Upgrade in under a minute — click the PayPal button above, and premium is active
          on your account immediately after payment.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-xl font-semibold">
            <a href="#checkout">Get Premium — $3/month</a>
          </Button>
        </div>
      </div>
    </main>
  )
}
