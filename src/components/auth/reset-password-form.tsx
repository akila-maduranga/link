"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Reset failed")
        return
      }
      toast.success("Password updated — you're signed in!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password reset link is missing its token.">
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Request a new reset link from the{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            forgot password
          </Link>{" "}
          page.
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Your new password must be strong and unique.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters, letters & numbers"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            className="rounded-xl"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full rounded-xl font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  )
}
