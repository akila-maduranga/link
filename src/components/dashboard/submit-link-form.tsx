"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronDown, Loader2, Send } from "lucide-react"
import { PLATFORMS, getPlatform } from "@/data/platforms"
import { CATEGORIES } from "@/data/categories"
import { COUNTRIES, countryFlag } from "@/data/countries"
import { LANGUAGES } from "@/data/languages"
import { PlatformIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function SubmitLinkForm() {
  const router = useRouter()
  const [platform, setPlatform] = useState("telegram")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("technology")
  const [country, setCountry] = useState("GLOBAL")
  const [language, setLanguage] = useState("en")
  const [members, setMembers] = useState("")
  const [countryOpen, setCountryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPlatform = getPlatform(platform)
  const selectedCountry = COUNTRIES.find((c) => c.code === country)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          description: description || undefined,
          platform,
          category,
          country,
          language,
          members: members || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Submission failed")
        return
      }
      toast.success(data.message)
      router.push("/dashboard/links")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Platform picker */}
      <div className="space-y-2">
        <Label>Platform</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all",
                platform === p.id
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
              aria-pressed={platform === p.id}
            >
              <PlatformIcon platform={p.id} className="h-6 w-6" />
              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
                {p.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Sharing a {selectedPlatform.name} {selectedPlatform.label.toLowerCase()}? You&apos;re in the right place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            minLength={3}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g. ${selectedPlatform.name} ${selectedPlatform.label} — Tech News`}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">Community URL</Label>
          <Input
            id="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`https://${platform === "telegram" ? "t.me/" : platform === "whatsapp" ? "chat.whatsapp.com/" : platform === "discord" ? "discord.gg/" : "example.com/"}…`}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this community about? Who should join? What do members get? (max 500 characters)"
          className="min-h-24 rounded-xl"
        />
        <p className="text-right text-xs text-muted-foreground">{description.length}/500</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-xl">
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="rounded-xl" aria-label="Language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-xl">
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name} · {l.native}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between rounded-xl font-normal"
              >
                {selectedCountry ? (
                  <span className="truncate">{countryFlag(selectedCountry.code)} {selectedCountry.name}</span>
                ) : (
                  "Select country"
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 rounded-xl p-0" align="start">
              <Command>
                <CommandInput placeholder="Search country…" />
                <CommandList className="max-h-64">
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {COUNTRIES.map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.code}`}
                        onSelect={() => {
                          setCountry(c.code)
                          setCountryOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", country === c.code ? "opacity-100" : "opacity-0")}
                        />
                        {countryFlag(c.code)} {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="members">Member count <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="members"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            placeholder="e.g. 12.5K"
            maxLength={20}
            className="rounded-xl"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <p>Listings go live instantly. Our team may feature high-quality communities on the homepage.</p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="rounded-xl px-8 font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Publishing…" : "Publish listing"}
        </Button>
        <Button asChild type="button" variant="ghost" className="rounded-xl">
          <Link href="/dashboard/links">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
