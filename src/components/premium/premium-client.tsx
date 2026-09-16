"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Crown, Loader2, ShieldCheck, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/* --------------------------------- types ---------------------------------- */

interface PayPalConfig {
  enabled: boolean
  clientId: string | null
  mode: string
  price: string
  currency: string
  days: number
  freeTrackableLimit: number
}

interface Me {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    isPremium: boolean
    premiumUntil: string | null
    trackableUsed: number
    trackableLimit: number | null
  } | null
}

interface PayPalButtonsOptions {
  style?: Record<string, string | number>
  createOrder: () => Promise<string>
  onApprove: (data: { orderID: string }) => Promise<void>
  onCancel?: () => void
  onError?: (err: unknown) => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonsOptions) => {
        render: (target: HTMLElement | string) => Promise<void>
        close?: () => Promise<void>
      }
    }
    gtag?: (...args: unknown[]) => void
  }
}

/* ----------------------------- SDK script load ----------------------------- */

/**
 * Load the PayPal JS SDK at runtime from the public client id served by
 * /api/paypal/config (works with credentials added to .env AFTER the image
 * was built — no rebuild needed). Sandbox mode uses the sandbox host.
 * Under the site's nonce+strict-dynamic CSP, a script injected via
 * createElement is allowed and propagates trust to its children.
 */
function loadPayPalSdk(clientId: string, currency: string, mode: string): Promise<void> {
  const host = mode === "sandbox" ? "https://www.sandbox.paypal.com" : "https://www.paypal.com"
  const src = `${host}/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-paypal-sdk="1"]`)
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve()
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.dataset.paypalSdk = "1"
    script.addEventListener("load", () => {
      script.dataset.loaded = "1"
      resolve()
    })
    script.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true })
    document.head.appendChild(script)
  })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

/* -------------------------------- component ------------------------------- */

type Phase = "loading" | "ready" | "not-configured" | "sdk-error"

export function PremiumClient() {
  const [config, setConfig] = useState<PayPalConfig | null>(null)
  const [me, setMe] = useState<Me["user"]>(null)
  const [meLoaded, setMeLoaded] = useState(false)
  const [phase, setPhase] = useState<Phase>("loading")
  const [refreshing, setRefreshing] = useState(false)
  const buttonsRef = useRef<HTMLDivElement | null>(null)
  const renderedRef = useRef(false)

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = (await res.json()) as Me
      setMe(data.user)
    } catch {
      setMe(null)
    } finally {
      setMeLoaded(true)
    }
  }, [])

  useEffect(() => {
    refreshMe()
    let active = true
    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then(async (cfg: PayPalConfig) => {
        if (!active) return
        setConfig(cfg)
        if (!cfg.enabled || !cfg.clientId) {
          setPhase("not-configured")
          return
        }
        await loadPayPalSdk(cfg.clientId, cfg.currency, cfg.mode)
        if (!active) return
        setPhase("ready")
      })
      .catch(() => {
        if (active) setPhase("sdk-error")
      })
    return () => {
      active = false
    }
  }, [refreshMe])

  // Render PayPal buttons once the SDK + session state are known.
  useEffect(() => {
    if (phase !== "ready" || !config) return
    const target = buttonsRef.current
    if (!target || renderedRef.current || !window.paypal?.Buttons) return
    renderedRef.current = true

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-order", { method: "POST" })
        const data = await res.json()
        if (!res.ok || !data.orderId) {
          throw new Error(data.error ?? "Could not start the checkout")
        }
        return data.orderId as string
      },
      onApprove: async (data) => {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          toast.error(json.error ?? "Payment verification failed")
          return
        }
        // Success — refresh entitlement + celebrate.
        setRefreshing(true)
        await refreshMe().finally(() => setRefreshing(false))
        toast.success("Premium is active on your account!")
        // GA4 purchase conversion (guard: gtag exists from layout).
        try {
          window.gtag?.("event", "purchase", {
            transaction_id: data.orderID,
            value: Number(config.price),
            currency: config.currency,
            items: [{ item_name: `Premium ${config.days}d` }],
          })
        } catch {
          /* analytics must never break checkout */
        }
      },
      onCancel: () => toast.info("Checkout cancelled — no charge was made"),
      onError: () => toast.error("PayPal reported an error. Please try again."),
    })

    buttons.render(target).catch((err: unknown) => {
      console.error("[premium] PayPal buttons render failed:", err)
    })

    return () => {
      buttons.close?.().catch(() => undefined)
    }
  }, [phase, config, refreshMe])

  /* ------------------------------- renderings ------------------------------ */

  const user = me
  const loggedIn = meLoaded && !!user
  const premium = user?.isPremium ?? false

  return (
    <section id="checkout" className="mx-auto mt-12 max-w-md scroll-mt-24" aria-label="Checkout">
      <div
        className={cn(
          "rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-8",
          premium ? "border-primary/40" : "border-border/60"
        )}
      >
        {/* Status line */}
        {!meLoaded || refreshing ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your plan…
          </div>
        ) : premium && user?.premiumUntil ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Crown className="h-4 w-4" /> Premium active
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Active until{" "}
              <strong className="text-foreground">{fmtDate(user.premiumUntil)}</strong>
              {daysLeft(user.premiumUntil) <= 7 && (
                <span className="ml-1 text-amber-500">
                  ({daysLeft(user.premiumUntil)} {daysLeft(user.premiumUntil) === 1 ? "day" : "days"} left)
                </span>
              )}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground/70">
              Paying again stacks — each payment adds {config?.days ?? 30} more days.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold tracking-tight">
              ${config?.price ?? "3.00"}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                {config?.currency ?? "USD"} / {config?.days ?? 30} days
              </span>
            </p>
            {user && user.trackableLimit !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                Free plan: {user.trackableUsed}/{user.trackableLimit} trackable links used
              </p>
            )}
          </div>
        )}

        {/* Checkout actions */}
        <div className="mt-6">
          {!loggedIn ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Sign in to upgrade your account
              </p>
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/login?next=/premium">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/register?next=/premium">Create a free account</Link>
              </Button>
            </div>
          ) : !user?.emailVerified ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-center text-sm text-destructive">
                Verify your email address first to enable checkout.
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/dashboard/settings">Resend verification</Link>
              </Button>
            </div>
          ) : phase === "not-configured" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium">Payments coming soon</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PayPal checkout isn&apos;t configured on this server yet. The site admin can
                enable it by setting PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.
              </p>
            </div>
          ) : phase === "sdk-error" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium">Could not load PayPal checkout</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check your connection and reload the page, then try again.
              </p>
            </div>
          ) : (
            /* PayPal Smart Payment Buttons mount here */
            <div>
              <div ref={buttonsRef} aria-label="PayPal checkout buttons" />
              {(phase === "loading" || !config) && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading secure checkout…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Payments are processed by PayPal — card details never touch our servers.
          </p>
          <p className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Every payment is verified server-side before premium activates.
          </p>
        </div>
      </div>
    </section>
  )
}
