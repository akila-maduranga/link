"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function UnverifiedBanner({ verified }: { verified: boolean }) {
  const [sending, setSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (verified || dismissed) return null

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
        toast.error(data.error ?? "Could not resend the email")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="font-semibold text-amber-600 dark:text-amber-400">Email not verified</p>
          <p className="mt-0.5 text-muted-foreground">
            Verify your email to unlock link submissions and the URL shortener.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={resend}
          disabled={sending}
          className="rounded-lg border-amber-500/40 hover:bg-amber-500/10"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Resend email
        </Button>
        <Button asChild size="sm" className="rounded-lg bg-amber-500 text-black hover:bg-amber-600">
          <Link href="/dashboard/settings">Settings</Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
