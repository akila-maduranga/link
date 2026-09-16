"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react"
import { formatCount, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface ShortLink {
  id: string
  slug: string
  destination: string
  title: string | null
  description: string | null
  isActive: boolean
  trackable: boolean
  clicks: number
  createdAt: string
}

interface MeUser {
  isPremium: boolean
  trackableUsed: number
  trackableLimit: number | null
}

export function ShortLinksClient() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<ShortLink | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/shortlinks?pageSize=50")
      const data = await res.json()
      if (data.ok) setLinks(data.links)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!query.trim()) return
    const t = setTimeout(async () => {
      const res = await fetch(`/api/shortlinks?q=${encodeURIComponent(query)}&pageSize=50`)
      const data = await res.json()
      if (data.ok) setLinks(data.links)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function shortUrl(slug: string) {
    return `${window.location.origin}/s/${slug}`
  }

  async function copy(slug: string, id: string) {
    await navigator.clipboard.writeText(shortUrl(slug))
    setCopiedId(id)
    toast.success("Short URL copied!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function toggleActive(link: ShortLink) {
    const res = await fetch(`/api/shortlinks/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "Update failed")
      return
    }
    setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)))
    toast.success(data.link.isActive ? "Short link activated" : "Short link paused")
  }

  async function remove() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/shortlinks/${deleting.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Delete failed")
        return
      }
      toast.success(data.message)
      setLinks((prev) => prev.filter((l) => l.id !== deleting.id))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = query.trim()
    ? links
    : links

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Short links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {links.length > 0 ? `${links.length} link${links.length === 1 ? "" : "s"} · ${formatCount(links.reduce((a, l) => a + l.clicks, 0))} total clicks` : "Create and track short URLs"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="rounded-xl gap-2 font-semibold">
          <Plus className="h-4 w-4" /> New short link
        </Button>
      </div>

      {links.length > 0 && (
        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by slug, title or destination…"
            className="rounded-xl bg-card pl-10"
            aria-label="Search short links"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Zap className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">No short links yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Shorten any URL, share it anywhere, and watch detailed analytics roll in —
            country, device, browser, referrer and more.
          </p>
          <Button onClick={() => setCreating(true)} className="mt-6 rounded-xl font-semibold">
            <Plus className="h-4 w-4" /> Create your first short link
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((link) => (
            <li key={link.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => copy(link.slug, link.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                      title="Copy short URL"
                    >
                      /s/{link.slug}
                      {copiedId === link.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {!link.isActive && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Paused
                      </span>
                    )}
                    {!link.trackable && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        No analytics
                      </span>
                    )}
                  </div>
                  {link.title && <p className="mt-1 truncate text-sm font-medium">{link.title}</p>}
                  <a
                    href={link.destination}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{link.destination}</span>
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-center">
                    {link.trackable ? (
                      <>
                        <p className="text-lg font-bold leading-none">{formatCount(link.clicks)}</p>
                        <p className="text-[10px] text-muted-foreground">clicks</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold leading-none text-muted-foreground/40">—</p>
                        <p className="text-[10px] text-muted-foreground">no analytics</p>
                      </>
                    )}
                  </div>
                  {link.trackable && (
                    <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
                      <Link href={`/dashboard/shortlinks/${link.id}`}>
                        <BarChart3 className="h-4 w-4" /> Analytics
                      </Link>
                    </Button>
                  )}
                  <Switch
                    checked={link.isActive}
                    onCheckedChange={() => toggleActive(link)}
                    aria-label={link.isActive ? "Pause short link" : "Activate short link"}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => setDeleting(link)}
                    aria-label="Delete short link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/70">
                Created {formatDate(link.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Create dialog */}
      {creating && (
        <CreateShortLinkDialog
          onClose={() => setCreating(false)}
          onCreated={(link) => {
            setLinks((prev) => [link, ...prev])
            setCreating(false)
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this short link?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">/s/{deleting?.slug}</span> will stop redirecting and all
              its analytics will be permanently deleted.
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

/* ---------------------------- Create dialog ---------------------------- */

function CreateShortLinkDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (link: ShortLink) => void
}) {
  const [destination, setDestination] = useState("")
  const [title, setTitle] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [trackable, setTrackable] = useState(true)
  const [meUser, setMeUser] = useState<MeUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotaHit, setQuotaHit] = useState(false)
  const [created, setCreated] = useState<ShortLink | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.user) setMeUser(d.user as MeUser)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  // Free accounts at the trackable limit: analytics is locked OFF here.
  const premiumOrUnlimited = !meUser || meUser.isPremium || meUser.trackableLimit === null
  const quotaUsedUp =
    !premiumOrUnlimited && (meUser?.trackableUsed ?? 0) >= (meUser?.trackableLimit ?? 0)
  const analyticsLocked = !premiumOrUnlimited && quotaUsedUp

  useEffect(() => {
    if (analyticsLocked) setTrackable(false)
  }, [analyticsLocked])

  async function create() {
    setSaving(true)
    setError(null)
    setQuotaHit(false)
    try {
      const res = await fetch("/api/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          title: title || undefined,
          customSlug: customSlug || undefined,
          trackable,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not create the short link")
        if (data.code === "TRACKABLE_QUOTA") setQuotaHit(true)
        return
      }
      setCreated(data.link)
      toast.success(data.link.trackable ? "Short link created!" : "Short link created (no analytics)")
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  async function copyCreated() {
    if (!created) return
    await navigator.clipboard.writeText(`${window.location.origin}/s/${created.slug}`)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
    onCreated(created)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Short link ready 🎉" : "New short link"}</DialogTitle>
          <DialogDescription>
            {created ? "Copy it and start sharing — analytics are live." : "Paste any long URL and claim a memorable code."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <a
                href={`/s/${created.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-primary"
              >
                {window.location.origin}/s/{created.slug}
              </a>
              <Button size="sm" variant="outline" onClick={copyCreated} className="shrink-0 rounded-lg">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              Destination: <a href={created.destination} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{created.destination}</a>
            </p>
            <Button onClick={() => onCreated(created)} className="w-full rounded-xl font-semibold">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dest">Destination URL</Label>
              <Input
                id="dest"
                type="url"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="https://example.com/very/long/url…"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My YouTube channel"
                maxLength={80}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Custom code <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-sm text-muted-foreground">/s/</span>
                <Input
                  id="slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="my-link"
                  maxLength={32}
                  className="rounded-xl font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">3–32 chars: letters, numbers, - and _</p>
            </div>

            {/* Click analytics toggle (premium-gated) */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor="trackable" className="text-sm font-medium">
                    Click analytics
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Track clicks, countries, devices & referrers
                  </p>
                </div>
                <Switch
                  id="trackable"
                  checked={trackable && !analyticsLocked}
                  disabled={analyticsLocked}
                  onCheckedChange={(v) => setTrackable(v)}
                  aria-label="Enable click analytics"
                />
              </div>
              {analyticsLocked && (
                <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                  <Crown className="h-3.5 w-3.5 shrink-0" />
                  Free limit reached ({meUser?.trackableUsed}/{meUser?.trackableLimit} tracked
                  links){" — "}
                  <Link href="/premium" className="font-semibold underline underline-offset-2">
                    upgrade for unlimited
                  </Link>
                </p>
              )}
              {!analyticsLocked && !premiumOrUnlimited && meUser && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {meUser.trackableUsed}/{meUser.trackableLimit} free tracked links used —{" "}
                  <Link href="/premium" className="text-primary hover:underline">
                    Premium removes the limit
                  </Link>
                </p>
              )}
            </div>

            {error && (
              <div
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-sm",
                  quotaHit ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                )}
                role="alert"
              >
                <p>{error}</p>
                {quotaHit && (
                  <Link
                    href="/premium"
                    className="mt-1 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                  >
                    <Crown className="h-3.5 w-3.5" /> Upgrade to Premium — $3/month
                  </Link>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button type="button" onClick={create} disabled={saving || !destination.trim()} className="rounded-xl font-semibold">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { type ShortLink as ShortLinkType }
