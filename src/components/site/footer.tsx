import Link from "next/link"
import { Logo } from "@/components/site/logo"
import { PlatformIcon } from "@/components/brand-icons"

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The open directory for finding and sharing social communities — plus a
              lightning-fast URL shortener with real-time analytics.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {["telegram", "whatsapp", "facebook", "youtube", "discord"].map((p) => (
                <span key={p} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card">
                  <PlatformIcon platform={p} className="h-4.5 w-4.5" />
                </span>
              ))}
            </div>
          </div>

          <nav aria-label="Product">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/explore" className="text-muted-foreground transition-colors hover:text-foreground">Explore directory</Link></li>
              <li><Link href="/dashboard/shortlinks" className="text-muted-foreground transition-colors hover:text-foreground">URL shortener</Link></li>
              <li><Link href="/dashboard/submit" className="text-muted-foreground transition-colors hover:text-foreground">Submit a link</Link></li>
              <li><Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">Create account</Link></li>
            </ul>
          </nav>

          <nav aria-label="Platforms">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top platforms</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/explore?platform=telegram" className="text-muted-foreground transition-colors hover:text-foreground">Telegram channels</Link></li>
              <li><Link href="/explore?platform=whatsapp" className="text-muted-foreground transition-colors hover:text-foreground">WhatsApp groups</Link></li>
              <li><Link href="/explore?platform=facebook" className="text-muted-foreground transition-colors hover:text-foreground">Facebook groups</Link></li>
              <li><Link href="/explore?platform=youtube" className="text-muted-foreground transition-colors hover:text-foreground">YouTube channels</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} FindLink · findlink.site. Built for communities.
          </p>
          <p className="text-xs text-muted-foreground">
            Self-hosted · Privacy-first analytics · Docker ready
          </p>
        </div>
      </div>
    </footer>
  )
}
