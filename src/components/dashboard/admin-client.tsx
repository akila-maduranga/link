"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Crown,
  CreditCard,
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
    premiumActive: number
    paypalPayments: number
    revenue: { total: string; currency: string }[]
  }
  recentUsers: {
    id: string
    name: string
    email: string
    createdAt: string
    emailVerified: string | null
    role: string
    premiumUntil: string | null
    isPremium: boolean
  }[]
  recentLinks: AdminLink[]
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  emailVerified: string | null
  premiumUntil: string | null
  isPremium: boolean
  createdAt: string
}

interface AdminPayment {
  id: string
  amount: string
  currency: string
  status: string
  orderId: string
  payerEmail: string | null
  payerName: string | null
  daysGranted: number
  source: string
  createdAt: string
  user: { id: string; name: string; email: string; premiumUntil: string | null }
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

  // Users & premium management
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userQuery, setUserQuery] = useState("")
  const [premiumBusy, setPremiumBusy] = useState<string | null>(null)

  // Payment history
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paySource, setPaySource] = useState("")

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats")
      const data = await res.json()
      if (data.ok) setStats(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: "20" })
      if (userQuery.trim()) params.set("q", userQuery.trim())
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.ok) setUsers(data.users)
    } finally {
      setUsersLoading(false)
    }
  }, [userQuery])

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: "20" })
      if (paySource) params.set("source", paySource)
      const res = await fetch(`/api/admin/payments?${params}`)
      const data = await res.json()
      if (data.ok) setPayments(data.payments)
    } finally {
      setPaymentsLoading(false)
    }
  }, [paySource])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    const t = setTimeout(loadUsers, userQuery ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadUsers, userQuery])

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

  async function setPremium(user: AdminUser, action: "grant" | "revoke") {
    setPremiumBusy(user.id)
    try {
      const res = await fetch("/api/admin/users/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Update failed")
        return
      }
      toast.success(data.message)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data.user } : u)))
      loadStats()
    } finally {
      setPremiumBusy(null)
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Users", value: t?.users ?? 0, sub: `${t?.verified ?? 0} verified`, icon: Users },
          { label: "Listings", value: t?.links ?? 0, sub: `${t?.hiddenLinks ?? 0} hidden · ${t?.featuredLinks ?? 0} featured`, icon: Link2 },
          { label: "Short links", value: t?.shortLinks ?? 0, sub: `${formatCount(t?.events ?? 0)} tracked events`, icon: Zap },
          { label: "Tracked clicks", value: t?.clicks ?? 0, sub: "all-time on short links", icon: MousePointerClick },
          {
            label: "Premium",
            value: t?.premiumActive ?? 0,
            sub:
              (t?.revenue?.length ?? 0) > 0
                ? `${t?.paypalPayments ?? 0} payments · ${t!.revenue.map((r) => `${r.total} ${r.currency}`).join(" · ")} collected`
                : `${t?.paypalPayments ?? 0} payments · no revenue yet`,
            icon: Crown,
          },
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
                      {u.isPremium && (
                        <Badge className="ml-1.5 rounded bg-primary/15 text-[9px] text-primary">
                          <Crown className="mr-0.5 h-2.5 w-2.5" /> PREMIUM
                        </Badge>
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

      {/* Users & premium management */}
      <section aria-labelledby="users-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="users-heading" className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="h-4.5 w-4.5 text-primary" /> Users &amp; premium
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users by name or email…"
              className="h-9 w-56 rounded-lg bg-card pl-9"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
              No users match this search.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:flex-row sm:items-center"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    u.isPremium ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {u.isPremium ? <Crown className="h-4 w-4" /> : u.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    {u.role === "ADMIN" && <Badge className="rounded text-[9px]">ADMIN</Badge>}
                    {u.isPremium ? (
                      <Badge className="rounded bg-primary/15 text-[9px] text-primary">
                        PREMIUM · until{" "}
                        {u.premiumUntil ? new Date(u.premiumUntil).toLocaleDateString() : "—"}
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground">free</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {u.email} · {u.emailVerified ? "verified" : "pending"} · joined{" "}
                    {formatDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant={u.isPremium ? "outline" : "default"}
                    className="h-8 rounded-lg text-xs font-semibold"
                    disabled={premiumBusy === u.id}
                    onClick={() => setPremium(u, "grant")}
                  >
                    {premiumBusy === u.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {u.isPremium ? "Extend +30d" : "Make premium"}
                  </Button>
                  {u.isPremium && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                      disabled={premiumBusy === u.id}
                      onClick={() => setPremium(u, "revoke")}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payment history */}
      <section aria-labelledby="payments-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="payments-heading" className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-4.5 w-4.5 text-primary" /> Premium payments
          </h2>
          <div className="flex gap-1">
            {[
              { id: "", label: "All" },
              { id: "PAYPAL", label: "PayPal" },
              { id: "ADMIN", label: "Admin grants" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPaySource(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  paySource === f.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {stats && (stats.totals.revenue?.length ?? 0) > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Collected via PayPal:{" "}
            <strong className="text-foreground">
              {stats.totals.revenue.map((r) => `${r.total} ${r.currency}`).join(" · ")}
            </strong>{" "}
            across {stats.totals.paypalPayments} payment{stats.totals.paypalPayments === 1 ? "" : "s"}.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
              No premium payments yet. PayPal purchases and admin grants will appear here.
            </p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">
                      {p.user.name}{" "}
                      <span className="font-normal text-muted-foreground">({p.user.email})</span>
                    </p>
                    {p.source === "PAYPAL" ? (
                      <Badge className="rounded bg-primary/15 text-[9px] text-primary">PAYPAL</Badge>
                    ) : (
                      <Badge className="rounded text-[9px]">ADMIN GRANT</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {p.orderId}
                    {p.payerEmail && p.payerEmail.toLowerCase() !== p.user.email.toLowerCase()
                      ? ` · paid from ${p.payerEmail}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {p.source === "PAYPAL" ? `${p.amount} ${p.currency}` : "grant"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">+{p.daysGranted} days</p>
                  </div>
                  <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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
