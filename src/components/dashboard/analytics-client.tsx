"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  Loader2,
  MousePointerClick,
  Monitor,
  Smartphone,
  Tablet,
  UserCheck,
} from "lucide-react"
import { formatCount } from "@/lib/format"
import { countryFlag } from "@/data/countries"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GroupRow {
  value: string
  count: number
}

interface Stats {
  range: string
  totals: { clicks: number; unique: number; bots: number; allTime: number }
  series: { day: string; count: number }[]
  countries: GroupRow[]
  browsers: GroupRow[]
  oses: GroupRow[]
  devices: GroupRow[]
  referrers: GroupRow[]
}

interface ShortLinkInfo {
  id: string
  slug: string
  destination: string
  title: string | null
  isActive: boolean
  clicks: number
}

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All time" },
]

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  bot: Bot,
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.slice(0, 40)
  }
}

export function AnalyticsClient({ link }: { link: ShortLinkInfo }) {
  const [range, setRange] = useState("30d")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [active, setActive] = useState(link.isActive)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shortlinks/${link.id}/stats?range=${range}`)
      const data = await res.json()
      if (data.ok) setStats(data)
    } finally {
      setLoading(false)
    }
  }, [link.id, range])

  useEffect(() => {
    load()
  }, [load])

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${link.slug}`)
    setCopied(true)
    toast.success("Short URL copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggle() {
    const res = await fetch(`/api/shortlinks/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !active }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "Update failed")
      return
    }
    setActive(data.link.isActive)
    toast.success(data.link.isActive ? "Short link activated" : "Short link paused")
  }

  const chartData = (stats?.series ?? []).map((p) => ({
    ...p,
    label: new Date(p.day + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  const shortUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${link.slug}`

  return (
    <div>
      {/* Header */}
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 rounded-lg text-muted-foreground">
        <Link href="/dashboard/shortlinks" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> All short links
        </Link>
      </Button>

      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 font-mono text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {shortUrl}
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={`/s/${link.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
                aria-label="Open short link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <span className="hidden max-w-56 truncate text-xs text-muted-foreground sm:inline">
                (redirects to <a href={link.destination} target="_blank" rel="noopener noreferrer" className="underline decoration-border hover:text-foreground">{safeHostname(link.destination)}</a>)
              </span>
            </div>
            {link.title && <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{link.title}</h1>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground">{active ? "Active" : "Paused"}</span>
            <Switch checked={active} onCheckedChange={toggle} aria-label="Toggle short link" />
          </div>
        </div>
      </div>

      {/* Range tabs */}
      <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={range === r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              range === r.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "All-time clicks", value: stats.totals.allTime, icon: MousePointerClick },
              { label: `Clicks · ${RANGES.find((r) => r.id === range)?.label}`, value: stats.totals.clicks, icon: MousePointerClick },
              { label: "Unique visitors", value: stats.totals.unique, icon: Fingerprint },
              { label: "Bot clicks", value: stats.totals.bots, icon: Bot },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-5">
                <c.icon className="h-4.5 w-4.5 text-primary" />
                <p className="mt-3 text-2xl font-bold tracking-tight">{formatCount(c.value)}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Clicks chart */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Clicks over time</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.015 165)",
                      border: "1px solid oklch(0.97 0.02 165 / 12%)",
                      borderRadius: "12px",
                      color: "#e8f2ed",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "#9fb3a9" }}
                    formatter={(value: number) => [`${value} click${value === 1 ? "" : "s"}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    fill="url(#clicksFill)"
                    dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0, fillOpacity: 0.7 }}
                    activeDot={{ r: 4, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Breakdowns */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <BreakdownCard title="Top countries" rows={stats.countries} format={(v) => `${countryFlag(v)} ${v === "Unknown" ? "Unknown" : v}`} />
            <BreakdownCard title="Browsers" rows={stats.browsers} />
            <BreakdownCard title="Operating systems" rows={stats.oses} />
            <BreakdownCard title="Referrers" rows={stats.referrers} emptyLabel="Direct / none" />
            <BreakdownCard title="Devices" rows={stats.devices} iconMap={DEVICE_ICONS} />
            <div className="rounded-2xl border border-border/60 bg-card p-5 md:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-semibold">Visitor quality</h3>
              <div className="mt-4 space-y-3">
                <QualityRow icon={UserCheck} label="Human clicks" value={Math.max(0, stats.totals.clicks - stats.totals.bots)} total={stats.totals.clicks} positive />
                <QualityRow icon={Bot} label="Bot clicks" value={stats.totals.bots} total={stats.totals.clicks} />
                <QualityRow icon={Fingerprint} label="Unique visitors" value={stats.totals.unique} total={stats.totals.clicks} positive />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                IPs are salted-hashed before storage — unique counts are accurate while raw
                addresses are never kept.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------- Breakdowns ------------------------------- */

function BreakdownCard({
  title,
  rows,
  format,
  iconMap,
  emptyLabel,
}: {
  title: string
  rows: GroupRow[]
  format?: (value: string) => string
  iconMap?: Record<string, React.ComponentType<{ className?: string }>>
  emptyLabel?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  const total = rows.reduce((a, r) => a + r.count, 0)

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No data yet — share your link to start collecting analytics.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => {
            const Icon = iconMap?.[r.value]
            return (
              <li key={r.value} className="flex items-center gap-3">
                <span className="flex h-6 w-16 shrink-0 items-center gap-1 text-xs font-medium">
                  {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                  <span className="truncate">{format ? format(r.value) : r.value}</span>
                </span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {formatCount(r.count)}
                  {total > 0 && (
                    <span className="block text-[10px] text-muted-foreground/60">
                      {Math.round((r.count / total) * 100)}%
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {rows.length === 0 && emptyLabel && (
        <p className="mt-2 text-center text-xs text-muted-foreground/60">{emptyLabel}</p>
      )}
    </div>
  )
}

function QualityRow({
  icon: Icon,
  label,
  value,
  total,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  total: number
  positive?: boolean
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className="font-semibold tabular-nums">
          {formatCount(value)} <span className="font-normal text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", positive ? "bg-primary" : "bg-muted-foreground/50")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
