"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Rocket } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devUrl, setDevUrl] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Registration failed")
        return
      }
      setDone(true)
      if (data.devVerificationUrl) setDevUrl(data.devVerificationUrl)
      toast.success(data.message)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="We sent you a verification email. Click the link inside to activate your account."
      >
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Rocket className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Once verified, you can sign in and start submitting links and shortening URLs
            right away.
          </p>
          <Button asChild variant="outline" className="mt-5 w-full rounded-xl">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
        {devUrl && (
          <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-card p-4 text-sm">
            <p className="font-medium text-primary">Dev mode — email delivery not configured</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1">RESEND_API_KEY</code> in your env to send
              real emails. For now, verify directly:
            </p>
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
      title="Create your account"
      subtitle="Join free — submit communities and shorten unlimited URLs."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Cooper"
            className="rounded-xl"
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters with at least one letter and one number.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full rounded-xl font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You'll receive a verification email via Resend to activate your account.
        </p>
      </form>
    </AuthShell>
  )
}
