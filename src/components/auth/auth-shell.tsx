import Link from "next/link"
import { Logo } from "@/components/site/logo"
import { PlatformIcon } from "@/components/brand-icons"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-0 lg:py-20 lg:px-8">
      {/* Brand panel */}
      <div className="bg-grid relative hidden overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <Logo size="lg" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Where communities
            <br />
            <span className="text-gradient">meet their people</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Join thousands of curators sharing the best groups, channels and pages —
            and track every click with pro-grade analytics.
          </p>
          <div className="mt-8 flex items-center gap-2.5">
            {["telegram", "whatsapp", "facebook", "youtube", "discord", "reddit"].map((p) => (
              <span key={p} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card">
                <PlatformIcon platform={p} className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Free forever · Self-hosted · Privacy-first
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center lg:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
