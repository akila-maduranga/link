"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LayoutDashboard, ShieldCheck, LogOut, Settings, Link2, Sparkles, ChevronDown, Crown } from "lucide-react"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  isPremium?: boolean
}

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
]

export function Navbar() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setUser(data.user)
          setLoaded(true)
        }
      })
      .catch(() => setLoaded(true))
    return () => {
      active = false
    }
  }, [pathname])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
    router.refresh()
  }

  const links = [
    ...NAV_LINKS,
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(user ? [{ href: "/premium", label: "Premium" }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
              <Link href="/explore">
                <Sparkles className="h-4 w-4 text-primary" />
                Discover
              </Link>
            </Button>
          </div>
          <ThemeToggle />

          {!loaded ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                    aria-label="Account menu"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden max-w-28 truncate md:inline">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                    {!user.emailVerified && (
                      <p className="mt-1.5 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                        Email not verified
                      </p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/shortlinks" className="cursor-pointer">
                      <Link2 className="h-4 w-4" /> My Short Links
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/premium" className="cursor-pointer">
                      <Crown className={cn("h-4 w-4", user.isPremium && "text-primary")} />
                      {user.isPremium ? "Premium" : "Upgrade to Premium"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl font-semibold">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center justify-between">
                <Logo size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium",
                      pathname.startsWith(link.href)
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t border-border pt-6">
                {user ? (
                  <Button onClick={logout} variant="outline" className="w-full rounded-xl">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full rounded-xl">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl font-semibold">
                      <Link href="/register" onClick={() => setMobileOpen(false)}>Create account</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
