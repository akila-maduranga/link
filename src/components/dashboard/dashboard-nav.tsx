"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Link2, Plus, Settings, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/submit", label: "Submit Link", icon: Plus },
  { href: "/dashboard/links", label: "My Listings", icon: Link2 },
  { href: "/dashboard/shortlinks", label: "Short Links", icon: Zap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/premium", label: "Premium", icon: Crown },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-24 hidden w-56 shrink-0 lg:block" aria-label="Dashboard navigation">
        <nav className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-2">
          {ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile horizontal tabs */}
      <div className="no-scrollbar sticky top-16 z-40 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
