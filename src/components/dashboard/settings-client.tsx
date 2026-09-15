"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Loader2, LogOut, Mail, RefreshCw, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Me {
  id: string
  name: string
  email: string
  role: string
  emailVerified: string | null
  createdAt: string
}

export function SettingsClient() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setMe(d.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function resend() {
    setSending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message, {
          action: data.devVerificationUrl
            ? {
                label: "Open link",
                onClick: () => (window.location.href = data.devVerificationUrl),
              }
            : undefined,
          duration: 15000,
        })
      } else {
        toast.error(data.error ?? "Could not resend")
      }
    } finally {
      setSending(false)
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!me) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load your profile.</p>
        <Button onClick={() => router.refresh()} variant="outline" className="mt-4 rounded-xl">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and preferences.</p>
      </div>

      {/* Profile card */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
            {me.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{me.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{me.email}</p>
          </div>
          {me.role === "ADMIN" && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </span>
          )}
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Member since</dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(me.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="mt-1 text-sm font-medium">{me.role === "ADMIN" ? "Administrator" : "Member"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email status</dt>
            <dd className="mt-1 text-sm font-medium">
              {me.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <BadgeCheck className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="text-destructive">Unverified</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Email verification */}
      {!me.emailVerified && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-amber-600 dark:text-amber-400">
                Verify your email
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Verifying unlocks link submissions and the URL shortener. Check your inbox —
                or request a fresh link below (expires in 24 hours).
              </p>
              <Button
                onClick={resend}
                disabled={sending}
                variant="outline"
                className="mt-4 gap-2 rounded-xl border-amber-500/40 hover:bg-amber-500/10"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Email delivery info */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-base font-semibold">About email delivery</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          FindLink sends verification and password-reset emails through the{" "}
          <a
            href="https://resend.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Resend
          </a>{" "}
          API. The server administrator configures this with a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">RESEND_API_KEY</code>{" "}
          environment variable — up to 100 emails/day on the free tier.
        </p>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-base font-semibold text-destructive">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign out of this browser. Your listings and short links stay active.
        </p>
        <Button
          onClick={logout}
          variant="outline"
          className="mt-4 gap-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </section>
    </div>
  )
}
