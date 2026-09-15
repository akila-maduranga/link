"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, MailCheck, XCircle, RefreshCw } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type State = "verifying" | "success" | "error"

export function VerifyEmailClient() {
  const params = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<State>("verifying")
  const [message, setMessage] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage("No verification token found in the link.")
      return
    }
    let active = true
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.ok) {
          setState("success")
          toast.success("Email verified!")
        } else {
          setState("error")
          setMessage(data.error ?? "Verification failed")
        }
      })
      .catch(() => {
        if (active) {
          setState("error")
          setMessage("Network error — please try again")
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function resend() {
    setResending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        if (data.devVerificationUrl) {
          toast.info("Dev mode: opening verification link", {
            action: { label: "Open", onClick: () => (window.location.href = data.devVerificationUrl) },
            duration: 15000,
          })
        }
      } else {
        toast.error(data.error ?? "Could not resend")
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title={state === "success" ? "Email verified" : "Email verification"}
      subtitle={
        state === "success"
          ? "Your account is now fully activated."
          : "Hang tight while we confirm your token…"
      }
    >
      <div className="rounded-2xl border bg-card p-8 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Welcome aboard! You now have full access to submissions and the shortener.
            </p>
            <Button asChild className="mt-6 w-full rounded-xl font-semibold">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-4 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={resend}
                disabled={resending}
                variant="outline"
                className="w-full rounded-xl"
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-xl">
                <Link href="/login">
                  <MailCheck className="h-4 w-4" /> Sign in with another account
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  )
}
