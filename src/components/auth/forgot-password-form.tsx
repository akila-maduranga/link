"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, KeyRound } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devUrl, setDevUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Request failed")
        return
      }
      setSent(true)
      if (data.devResetUrl) setDevUrl(data.devResetUrl)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If an account exists for this email, a reset link has been sent."
      >
        <div className="rounded-2xl border bg-card p-6 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The reset link expires in 1 hour. Didn&apos;t get it? Check your spam folder.
          </p>
          <Button asChild variant="outline" className="mt-5 w-full rounded-xl">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
        {devUrl && (
          <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-card p-4 text-sm">
            <p className="font-medium text-primary">Dev mode — email delivery not configured</p>
            <a
              href={devUrl}
              className="mt-2 block truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs text-primary hover:underline"
            >
              {devUrl}
            </a>
          </div>
        )}
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full rounded-xl font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  )
}
