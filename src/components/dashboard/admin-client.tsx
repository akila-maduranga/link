"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Star,
  Trash2,
  Users,
  Zap,
  Link2,
  MousePointerClick,
  Activity,
} from "lucide-react"
import { formatCount, formatDate } from "@/lib/format"
import { PlatformIcon } from "@/components/brand-icons"
import { countryFlag } from "@/data/countries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AdminStats {
  totals: {
    users: number
    verified: number
    links: number
    hiddenLinks: number
    featuredLinks: number
    shortLinks: number
    clicks: number
    events: number
  }
  recentUsers: {
    id: string
    name: string
    email: string
    createdAt: string
    emailVerified: string | null
    role: string
  }[]
  recentLinks: AdminLink[]
}

interface AdminLink {
  id: string
  slug: string
  title: string
  url: string
  platform: string
  category: string
  country: string
  status: string
  featured: boolean
  clicks: number
  views: number
  createdAt: string
  user: { name: string; email: string }
}

export function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [links, setLinks] = useState<AdminLink[]>([])
  const [loading, setLoading] = useState(true)
  const [linksLoading, setLinksLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<AdminLink | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats")
      const data = await res.json()
      if (data.ok) setStats(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: "30" })
      if (statusFilter) params.set("status", statusFilter)
      if (query.trim()) params.set("q", query.trim())
      const res = await fetch(`/api/admin/links?${params}`)
      const data = await res.json()
      if (data.ok) setLinks(data.links)
    } finally {
      setLinksLoading(false)
    }
  }, [statusFilter, query])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const t = setTimeout(loadLinks, query ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadLinks, query])

  async function moderate(link: AdminLink, patch: { featured?: boolean; status?: string }) {
    const res = await fetch("/api/admin/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: link.id, ...patch }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "Update failed")
      return
    }
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, ...patch, ...data.link } : l))
    )
    toast.success("Link updated")
    loadStats()
  }

  async function remove() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/links/${deleting.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Delete failed")
        return
      }
      toast.success(data.message)
      setLinks((prev) => prev.filter((l) => l.id !== deleting.id))
      loadStats()
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const t = stats?.totals

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and content moderation.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Users", value: t?.users ?? 0, sub: `${t?.verified ?? 0} verified`, icon: Users },
          { label: "Listings", value: t?.links ?? 0, sub: `${t?.hiddenLinks ?? 0} hidden · ${t?.featuredLinks ?? 0} featured`, icon: Link2 },
          { label: "Short links", value: t?.shortLinks ?? 0, sub: `${formatCount(t?.events ?? 0)} tracked events`, icon: Zap },
          { label: "Tracked clicks", value: t?.clicks ?? 0, sub: "all-time on short links", icon: MousePointerClick },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <c.icon className="h-4.5 w-4.5 text-primary" />
            <p className="mt-3 text-2xl font-bold tracking-tight">{formatCount(c.value)}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Link moderation */}
        <section className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Link moderation</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search links…"
                  className="h-9 w-52 rounded-lg bg-card pl-9"
                  aria-label="Search links"
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: "", label: "All" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "HIDDEN", label: "Hidden" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      statusFilter === f.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {linksLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : links.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
                No links match this view.
              </p>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:flex-row sm:items-center"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50">
                    <PlatformIcon platform={link.platform} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/link/${link.slug}`} className="truncate text-sm font-semibold hover:text-primary">
                        {link.title}
                      </Link>
                      {link.featured && <Badge className="rounded text-[10px]">Featured</Badge>}
                      {link.status === "HIDDEN" && (
                        <Badge variant="destructive" className="rounded text-[10px]">Hidden</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {link.user.name} · {countryFlag(link.country)} · {formatCount(link.clicks)} clicks · {formatDate(link.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => moderate(link, { featured: !link.featured })}
                      aria-label={link.featured ? "Remove from featured" : "Mark as featured"}
                      title={link.featured ? "Unfeature" : "Feature"}
                    >
                      <Star className={cn("h-4 w-4", link.featured ? "fill-primary text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => moderate(link, { status: link.status === "HIDDEN" ? "ACTIVE" : "HIDDEN" })}
                      aria-label={link.status === "HIDDEN" ? "Show link" : "Hide link"}
                      title={link.status === "HIDDEN" ? "Unhide" : "Hide"}
                    >
                      {link.status === "HIDDEN" ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => setDeleting(link)}
                      aria-label="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent users */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-4.5 w-4.5 text-primary" /> Recent users
          </h2>
          <ul className="mt-4 space-y-2">
            {stats?.recentUsers.map((u) => (
              <li key={u.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {u.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.name}
                      {u.role === "ADMIN" && (
                        <Badge className="ml-1.5 rounded text-[9px]">ADMIN</Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {u.emailVerified ? (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                  ) : (
                    <span className="shrink-0 text-[10px] font-medium text-amber-500">pending</span>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground/70">
                  Joined {formatDate(u.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
