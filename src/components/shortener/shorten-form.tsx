"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, Link2, Loader2, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ShortenFormProps {
  variant?: "hero" | "dashboard"
  className?: string
  /**
   * Server-rendered session snapshot (from the page's getSession()) so the
   * hero hint shows the right copy on the FIRST paint — no guest→authed
   * flash while /api/auth/me resolves. undefined = unknown (fetch as before).
   */
  serverSession?: { verified: boolean } | null
}

interface SessionUser {
  id: string
  name: string
  role: string
  emailVerified: boolean
}

export function ShortenForm({ variant = "hero", className, serverSession }: ShortenFormProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState<SessionUser | null | undefined>(
    serverSession === undefined
      ? undefined
      : serverSession
        ? { id: "", name: "", role: "USER", emailVerified: serverSession.verified }
        : null,
  )

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
    return () => {
      active = false
    }
  }, [])

  async function shorten() {
    const trimmed = url.trim()
    if (!trimmed) {
      toast.error("Paste a URL first")
      return
    }
    if (user === null) {
      toast.info("Sign in to shorten links — it's free", {
        action: { label: "Sign in", onClick: () => (window.location.href = "/login") },
      })
      return
    }
    if (user && !user.emailVerified) {
      toast.error("Verify your email first to shorten links", {
        action: { label: "Resend email", onClick: () => (window.location.href = "/dashboard/settings") },
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "TRACKABLE_QUOTA") {
          toast.error(data.error ?? "Free plan limit reached", {
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/premium"),
            },
          })
        } else {
          toast.error(data.error ?? "Could not shorten this URL")
        }
        return
      }
      const shortUrl = `${window.location.origin}/s/${data.link.slug}`
      setResult(shortUrl)
      setUrl("")
      toast.success(data.link.trackable ? "Short link created!" : "Short link created (no analytics)")
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  async function copyResult() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const isHero = variant === "hero"

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-xl shadow-black/5 backdrop-blur sm:flex-row sm:items-center",
          isHero && "sm:rounded-full sm:p-1.5"
        )}
      >
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && shorten()}
            type="url"
            inputMode="url"
            placeholder="Paste your long URL here…"
            aria-label="URL to shorten"
            className={cn(
              "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70",
              isHero ? "py-3 pl-10 pr-3" : "rounded-xl border border-border/60 bg-background/50 py-2.5 pl-10 pr-3"
            )}
          />
        </div>
        <Button
          onClick={shorten}
          disabled={loading}
          size="lg"
          className={cn(
            "gap-2 font-semibold",
            isHero && "sm:rounded-full sm:px-7"
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isHero ? (
            <Zap className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Shortening…" : "Shorten"}
        </Button>
      </div>

      {result && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <a
            href={result}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {result}
          </a>
          <Button variant="outline" size="sm" onClick={copyResult} className="shrink-0 rounded-lg">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      {isHero && (
        <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {user ? (
            <>
              Free · Custom aliases ·{" "}
              <span className="font-medium text-primary">
                {user.emailVerified ? "Click analytics included" : "Verify your email to start"}
              </span>
            </>
          ) : (
            <>
              Free · Requires a{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                verified account
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
