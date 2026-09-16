"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, SlidersHorizontal, Loader2, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { LinkCard, type DirectoryLink } from "@/components/links/link-card"
import { PLATFORMS } from "@/data/platforms"
import { CATEGORIES } from "@/data/categories"
import { COUNTRIES, countryFlag } from "@/data/countries"
import { LANGUAGES } from "@/data/languages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function ExploreClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const platform = searchParams.get("platform") ?? ""
  const category = searchParams.get("category") ?? ""
  const country = searchParams.get("country") ?? ""
  const language = searchParams.get("language") ?? ""
  const sort = searchParams.get("sort") ?? "new"
  const q = searchParams.get("q") ?? ""
  const page = Number(searchParams.get("page")) || 1

  const [searchInput, setSearchInput] = useState(q)
  const [links, setLinks] = useState<DirectoryLink[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [countryOpen, setCountryOpen] = useState(false)

  const activeFilters = useMemo(
    () => [platform, category, country, language, q].filter(Boolean).length,
    [platform, category, country, language, q]
  )

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
      if (key !== "page") params.delete("page")
      router.push(`/explore${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
    },
    [searchParams, router]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (platform) params.set("platform", platform)
    if (category) params.set("category", category)
    if (country) params.set("country", country)
    if (language) params.set("language", language)
    if (sort && sort !== "new") params.set("sort", sort)
    if (q) params.set("q", q)
    params.set("page", String(page))
    params.set("pageSize", "12")

    let active = true
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/links?${params.toString()}`, { signal: controller.signal })
        const data = await res.json()
        if (!active) return
        if (data.ok) {
          setLinks(data.links)
          setPagination(data.pagination)
        }
      } catch {
        /* aborted or network error */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [platform, category, country, language, sort, q, page])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setParam("q", searchInput.trim())
  }

  function clearAll() {
    setSearchInput("")
    router.push("/explore", { scroll: false })
  }

  function goPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`/explore?${params.toString()}`, { scroll: true })
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === country)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Explore the directory</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Browse {pagination ? `${pagination.total.toLocaleString()} communities` : "communities"} across 15
          platforms — filter by category, country and language.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles and descriptions…"
            className="rounded-xl bg-card pl-10"
            aria-label="Search the directory"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("")
                if (q) setParam("q", "")
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="rounded-xl font-semibold">Search</Button>
      </form>

      {/* Platform pills — 44px touch targets on mobile */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setParam("platform", "")}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors sm:py-1.5",
            !platform
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          All platforms
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setParam("platform", p.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors sm:py-1.5",
              platform === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Filters — 2 equal columns on mobile (full-width controls, thumb-friendly),
          flexible single row on sm+ */}
      <div className="mt-4 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />

        <Select value={category || "all"} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger className="w-full rounded-xl bg-card sm:w-44" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="max-h-80 rounded-xl">
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl bg-card font-normal sm:w-48"
            >
              <span className="truncate">
                {selectedCountry
                  ? `${countryFlag(selectedCountry.code)} ${selectedCountry.name}`
                  : "All countries"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 rounded-xl p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country…" />
              <CommandList className="max-h-64">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setParam("country", "")
                      setCountryOpen(false)
                    }}
                  >
                    🌍 All countries
                  </CommandItem>
                  {COUNTRIES.map((c) => (
                    <CommandItem
                      key={c.code}
                      value={`${c.name} ${c.code}`}
                      onSelect={() => {
                        setParam("country", c.code)
                        setCountryOpen(false)
                      }}
                    >
                      {countryFlag(c.code)} {c.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={language || "all"} onValueChange={(v) => setParam("language", v)}>
          <SelectTrigger className="w-full rounded-xl bg-card sm:w-44" aria-label="Filter by language">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent className="max-h-80 rounded-xl">
            <SelectItem value="all">All languages</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.name} · {l.native}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="w-full rounded-xl bg-card sm:w-40" aria-label="Sort results">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="new">Newest first</SelectItem>
            <SelectItem value="popular">Most clicked</SelectItem>
            <SelectItem value="featured">Featured first</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            onClick={clearAll}
            className="col-span-2 justify-self-center gap-1.5 rounded-xl text-muted-foreground sm:col-span-1 sm:justify-self-start"
            size="sm"
          >
            <X className="h-3.5 w-3.5" /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-12 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : links.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page <= 1}
                onClick={() => goPage(pagination.page - 1)}
                className="h-10 w-10 rounded-xl"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4))
                return start + i
              })
                .filter((p) => p >= 1 && p <= pagination.totalPages)
                .map((p) => (
                  <Button
                    key={p}
                    variant={p === pagination.page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goPage(p)}
                    className="h-10 w-10 rounded-xl"
                    aria-label={`Page ${p}`}
                    aria-current={p === pagination.page ? "page" : undefined}
                  >
                    {p}
                  </Button>
                ))}
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goPage(pagination.page + 1)}
                className="h-10 w-10 rounded-xl"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No communities found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try removing some filters or search for something different. You can also
            submit a new listing yourself.
          </p>
          <Button variant="outline" onClick={clearAll} className="mt-6 rounded-xl">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
