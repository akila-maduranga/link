"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import type { DirectoryLink } from "@/components/links/link-card"
import { PlatformIcon } from "@/components/brand-icons"
import { getPlatform } from "@/data/platforms"
import { formatCount, formatDate } from "@/lib/format"
import { countryFlag, countryName } from "@/data/countries"
import { languageName } from "@/data/languages"
import { getCategory } from "@/data/categories"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES } from "@/data/categories"
import { LANGUAGES } from "@/data/languages"
import { COUNTRIES, countryFlag as flagOf } from "@/data/countries"
import { toast } from "sonner"

export function MyLinksClient() {
  const [links, setLinks] = useState<DirectoryLink[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<DirectoryLink | null>(null)
  const [deleting, setDeleting] = useState<DirectoryLink | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/links?mine=1&pageSize=48")
      const data = await res.json()
      if (data.ok) setLinks(data.links)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function deleteLink() {
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
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {links.length > 0 ? `${links.length} communit${links.length === 1 ? "y" : "ies"} listed` : "Manage your directory listings"}
          </p>
        </div>
        <Button asChild className="rounded-xl gap-2 font-semibold">
          <Link href="/dashboard/submit">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <PlatformIcon platform="telegram" className="mx-auto h-10 w-10" />
          <h3 className="mt-4 text-lg font-semibold">No listings yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Share your first Telegram channel, WhatsApp group or Facebook page with the directory.
          </p>
          <Button asChild className="mt-6 rounded-xl font-semibold">
            <Link href="/dashboard/submit">Submit your first link</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50">
                <PlatformIcon platform={link.platform} className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/link/${link.slug}`} className="truncate font-semibold hover:text-primary">
                    {link.title}
                  </Link>
                  {link.status === "HIDDEN" && (
                    <Badge variant="destructive" className="rounded-md text-[10px]">Hidden</Badge>
                  )}
                  {link.featured && (
                    <Badge className="rounded-md text-[10px]">Featured</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{link.url}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{getPlatform(link.platform).name}</span>
                  <span>{getCategory(link.category).name}</span>
                  <span>{countryFlag(link.country)} {countryName(link.country).split(" /")[0]}</span>
                  <span>{languageName(link.language)}</span>
                  <span>· {formatDate(link.createdAt)}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold">{formatCount(link.views)}</p>
                  <p className="text-[10px] text-muted-foreground">views</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{formatCount(link.clicks)}</p>
                  <p className="text-[10px] text-muted-foreground">clicks</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="Open link">
                    <a href={`/go/${link.slug}`} target="_blank" rel="noopener noreferrer nofollow">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={() => setEditing(link)}
                    aria-label="Edit listing"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => setDeleting(link)}
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit dialog */}
      {editing && (
        <EditLinkDialog
          link={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
            setEditing(null)
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be permanently removed from the directory. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteLink}
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

/* ------------------------------- Edit dialog ------------------------------- */

function EditLinkDialog({
  link,
  onClose,
  onSaved,
}: {
  link: DirectoryLink
  onClose: () => void
  onSaved: (link: DirectoryLink) => void
}) {
  const [title, setTitle] = useState(link.title)
  const [description, setDescription] = useState(link.description ?? "")
  const [category, setCategory] = useState(link.category)
  const [country, setCountry] = useState(link.country)
  const [language, setLanguage] = useState(link.language)
  const [members, setMembers] = useState(link.members ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          country,
          language,
          members: members || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Update failed")
        return
      }
      toast.success(data.message)
      onSaved(data.link)
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>Update your listing details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="min-h-20 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {flagOf(c.code)} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-members">Members</Label>
              <Input id="edit-members" value={members} onChange={(e) => setMembers(e.target.value)} className="rounded-xl" maxLength={20} placeholder="12.5K" />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="button" onClick={save} disabled={saving} className="rounded-xl font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
