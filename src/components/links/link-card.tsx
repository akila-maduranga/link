"use client"

import Link from "next/link"
import { useState } from "react"
import { Check, Copy, Eye, MousePointerClick, Star, Users } from "lucide-react"
import { PlatformIcon } from "@/components/brand-icons"
import { getPlatform } from "@/data/platforms"
import { getCategory } from "@/data/categories"
import { countryFlag, countryName } from "@/data/countries"
import { languageName } from "@/data/languages"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface DirectoryLink {
  id: string
  slug: string
  title: string
  url: string
  description: string | null
  platform: string
  category: string
  country: string
  language: string
  members: string | null
  featured: boolean
  status?: string
  views: number
  clicks: number
  createdAt: string | Date
  user?: { name: string } | null
}

export function LinkCard({ link, compact = false }: { link: DirectoryLink; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const platform = getPlatform(link.platform)
  const category = getCategory(link.category)

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return (
    <article
      className={cn(
        "card-hover group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        link.featured && "border-primary/30"
      )}
    >
      {link.featured && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
          <Star className="h-3 w-3 fill-current" /> Featured
        </span>
      )}

      <div className="flex items-start gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40"
          style={{ boxShadow: `0 4px 16px -6px ${platform.color}55` }}
        >
          <PlatformIcon platform={link.platform} className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          {/* h3: listing pages render h1 (page) → h2 (section) → h3 (card),
              giving crawlers a clean heading hierarchy on directory grids. */}
          <h3 className="truncate text-base font-semibold leading-snug">
            <Link
              href={`/link/${link.slug}`}
              className="block truncate transition-colors group-hover:text-primary"
            >
              {link.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium" style={{ color: platform.color }}>{platform.name}</span>
            {link.members && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {link.members}
              </span>
            )}
          </p>
        </div>
      </div>

      {!compact && link.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {link.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="rounded-md text-[11px] font-medium">
          {category.name}
        </Badge>
        <Badge variant="secondary" className="rounded-md text-[11px] font-medium">
          {countryFlag(link.country)} {countryName(link.country).split(" /")[0]}
        </Badge>
        <Badge variant="secondary" className="rounded-md text-[11px] font-medium">
          {languageName(link.language)}
        </Badge>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-4 mt-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Views">
            <Eye className="h-3.5 w-3.5" /> {formatCount(link.views)}
          </span>
          <span className="inline-flex items-center gap-1" title="Clicks">
            <MousePointerClick className="h-3.5 w-3.5" /> {formatCount(link.clicks)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyUrl}
            className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground sm:h-8.5 sm:w-8.5"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm" className="h-10 rounded-lg px-4 font-semibold sm:h-8">
            <a
              href={`/go/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center"
            >
              Join
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
